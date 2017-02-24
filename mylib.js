function Ezgl(gl) {
  const offscreen = gl.createFramebuffer();
  const attribute = Symbol('attribute'), uniform = Symbol('uniform');
  const sizes = {int: 1, float: 1, vec2: 2, vec3: 3, vec4: 4, mat2: 4, mat3: 9, mat4: 16};
  const programCache = {};

  function preprocessSource(code) {
    const baseIndent = /^\n?( *)/.exec(code)[1];
    const re = new RegExp('^' + baseIndent, 'mg');
    return '#version 300 es\nprecision highp float;\n' + code.replace(re, '');
  }

  function compileShader(shader_type, code) {
    const shader = gl.createShader(shader_type);
    code = preprocessSource(code);
    gl.shaderSource(shader, code);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        let errors = gl.getShaderInfoLog(shader).split('\n');
        for(let i=0; i<errors.length - 1; i++) {
            let match = /ERROR: [^:]*:(\d+): (.*)$/.exec(errors[i]);
            if(match) {
                let index = parseInt(match[1]);
                let lines = code.split(/\n|\r/g);
                console.error(match[2], '\n ', lines.slice(index-3, index-1).join('\n  ') + '\n> ' + lines.slice(index-1, index+2).join('\n  '));
            } else {
                console.error(errors[i]);
            }
        }
    }
    return shader;
  }

  function getBindings(program, vertex, fragment) {
    let bindings = {}, match;
    function bind(re, code) {
      while (match = re.exec(code)) {
        const [, binding_type_str, type, name] = match;
        const binding_type = {'in': attribute, uniform}[binding_type_str];
        const index = binding_type == attribute ? gl.getAttribLocation(program, name) : gl.getUniformLocation(program, name);
        if (index == -1) {
          throw `Could not locate ${binding_type_str} "${name}" in shader code`;
        }
        if (binding_type == attribute) {
          gl.enableVertexAttribArray(index);
        }
        bindings[name] = {binding_type, type, index};
      }
    }
    bind(/^ *(in|uniform) (bool|int|float|vec[234]|sampler[23]D) ([^;]*);/gm, vertex);
    bind(/^ *(uniform) (bool|int|float|vec[234]|sampler[23]D) ([^;]*);/gm, fragment);
    return bindings;
  }

  function createProgram({vertex, fragment}) {
    const key = vertex + fragment;
    if (!(key in programCache)) {
      const program = gl.createProgram();
      gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertex));
      gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragment));
      gl.linkProgram(program);
      programCache[key] = {program, bindings: getBindings(program, vertex, fragment)};
    }
    return programCache[key];
  }

  function AttributeArray({buffer=null, data=null, size=1, type=gl.FLOAT, normalized=false, stride=0, offset=0}) {
    if (data != null) {
      buffer = createArrayBuffer(data);
    }
    return {constructor: AttributeArray, buffer, size, type, normalized, stride, offset};
  }

  function bind(program, bindings) {
    gl.useProgram(program.program);

    let texture = 0;
    for (let name in bindings) {
      const value = bindings[name];
      const {binding_type, type, index} = program.bindings[name];
      if (binding_type == attribute) {
        if (value.constructor == AttributeArray) {
          console.assert(value.buffer.constructor == WebGLBuffer);
          gl.bindBuffer(gl.ARRAY_BUFFER, value.buffer);
          if (value.type == gl.FLOAT) {
            gl.vertexAttribPointer(index, value.size, value.type, value.normalized, value.stride, value.offset);
          } else {
            gl.vertexAttribIPointer(index, value.size, value.type, value.stride, value.offset);
          }
        } else {
          throw 'TODO: constant attributes';
        }
      } else if (binding_type == uniform) {
        // null index --> unused uniform
        if (index != null) {
          if (type == 'sampler2D') {
            console.assert(value.constructor == WebGLTexture);
            gl.uniform1i(index, texture);
            gl.activeTexture(gl.TEXTURE0 + texture);
            gl.bindTexture(gl.TEXTURE_2D, value);
            texture++;
          } else {
            console.assert((sizes[type] == 1 && !(value instanceof Array)) || value.length == sizes[type]);
            switch (type) {
              case 'int': gl.uniform1i(index, value); break;
              case 'float': gl.uniform1f(index, value); break;
              case 'vec2': gl.uniform2fv(index, value); break;
              case 'vec3': gl.uniform3fv(index, value); break;
              case 'vec4': gl.uniform4fv(index, value); break;
              case 'mat2': gl.uniformMatrix2fv(index, value); break;
              case 'mat3': gl.uniformMatrix3fv(index, value); break;
              case 'mat4': gl.uniformMatrix4fv(index, value); break;
              default: throw 'unknown type';
            }
          }
        }
      } else {
        throw 'unknown binding_type';
      }
    }
  }

  function createArrayBuffer(data, hint=gl.STATIC_DRAW) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, hint);
    return buffer;
  }

  function createElementArrayBuffer(data, hint=gl.STATIC_DRAW) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, hint);
    return buffer;
  }

  function createTexture({target=gl.TEXTURE_2D, mag=gl.LINEAR, min=gl.LINEAR, wrap=[gl.MIRRORED_REPEAT, gl.MIRRORED_REPEAT, gl.MIRRORED_REPEAT], flipY=false}={}) {
    const texture = gl.createTexture();
    gl.bindTexture(target, texture)
    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, mag);
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, min);
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, wrap[0]);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, wrap[1]);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);
    if (target == gl.TEXTURE_3D) {
      gl.texParameteri(target, gl.TEXTURE_WRAP_R, wrap[2]);
    }
    return texture;
  }

  function loadImages(urls, callback) {
    let images = {}, total = Object.keys(urls).length, count = 0;
    for (let key in urls) {
      const img = new Image();
      images[key] = img;
      img.onload = function() {
        count++;
        if(count == total) {
          callback(images);
        }
      };
      img.src = urls[key];
    }
  }

  function texImage2D(image, {texture=createTexture(), level=0, internalFormat=gl.RGBA, format=gl.RGBA, type=gl.UNSIGNED_BYTE}={}) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, format, type, image);
    return texture;
  }

  function createRenderTargets({width, height, textures, internalFormat=gl.RGBA, format=gl.RGBA, type=gl.UNSIGNED_BYTE, depth_buffer=false}) {
    let targets = {textures, depth: null};
    for (let i=0; i<textures.length; i++) {
      gl.bindTexture(gl.TEXTURE_2D, textures[i]);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);
    }
    if (depth_buffer) {
      targets.depth = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, targets.depth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    }
    return targets;
  }

  function bindRenderTargets(renderTargets) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, offscreen);
    for (let i=0; i<renderTargets.textures.length; i++) {
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, renderTargets.textures[i], 0);
    }
    if (renderTargets.depth) {
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderTargets.depth);
    }
  }

  return {createProgram, AttributeArray, bind, createArrayBuffer, createElementArrayBuffer, createTexture, loadImages, texImage2D, createRenderTargets, bindRenderTargets};
}

// TODO: 3d texture, srgb, instanced rendering

function webgl_examples() {
  // depth
  gl.enable(gl.DEPTH_TEST);
  gl.depthMask(true);
  gl.depthFunc(gl.LESS);
  gl.depthRange(0.0, 1.0);

  // blend
  gl.enable(gl.BLEND);
  gl.blendEquation(gl.FUNC_ADD);
  gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);

  // offset (for decals)
  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1.0, 0.1);

  // culling
  gl.enable(gl.CULL_FACE);
  gl.frontFace(gl.CCW);
  gl.cullFace(gl.BACK);

  // by default version 300 es defines:
  // vertex
  //   in highp int gl_VertexID;
  //   in highp int gl_InstanceID;
  //   out highp vec4 gl_Position;  - output this to get clipping and culling.
  //   out highp float gl_PointSize;  - size of point to draw
  //
  // fragment
  //   in highp vec4 gl_FragCoord;  - vec4(gl_Position.xyz / gl_Position.w, gl_Position.w)
  //   in bool gl_FrontFacing;
  //   out highp float gl_FragDepth;
  //   in mediump vec2 gl_PointCoord;
}
