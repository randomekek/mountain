function Ezgl(gl) {
  const offscreen = gl.createFramebuffer();
  const glsl_library = {};
  addLibrary('perspective', `
    vec2 $name(vec2 aa) {
      return aa + vec2(0.1, 0.0);
    }`);

  function addLibrary(name, func) {
    glsl_library[name] = func.replace('$name', 'import_' + name);
  }

  function preprocessSource(code) {
    let re = /\$(\w*)\(/g, imports = {};
    code = code.replace(re, function(match, method) {
      imports[method] = glsl_library[method];
      return `import_${method}(`;
    });
    const import_list = Object.keys(imports).map(key => imports[key]);
    return import_list.join('\n') + '\n// == Code ==\n' + code;
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
        throw "Shader compile error";
    }
    return shader;
  }

  function getAttributes(program, code) {
    let attributes = {}, match;
    const re = /attribute (float|vec[234]) ([^;]*);/g;
    while (match = re.exec(code)) {
      const [, type, name] = match;
      const index = gl.getAttribLocation(program, name);
      if (index == -1) {
        throw `Could not bind attribute "${name}" in shader`;
      }
      gl.enableVertexAttribArray(index);
      attributes[name] = {index, type};
    }
    return attributes;
  }

  function getUniforms(program, code) {
    let uniforms = {}, match;
    const re = /uniform (float|vec[234]|sampler[123]D|samplerCube) ([^;]*);/g;
    while (match = re.exec(code)) {
      const [, type, name] = match;
      if (!(name in uniforms)) {
        const index = gl.getUniformLocation(program, name);
        if (index == -1) {
          throw `Could not bind attribute "${name}" in shader`;
        }
        uniforms[name] = {index, type};
      }
    }
    return uniforms;
  }

  function createProgram(vertex, fragment) {
    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    return {
      program,
      attributes: getAttributes(program, vertex),
      uniforms: getUniforms(program, vertex + fragment)};
  }

  function Attribute({buffer, type=gl.FLOAT, normalized=false, stride=0, offset=0}) {
    return {buffer, type, normalized, stride, offset};
  }

  const sizes = {'float': 1, vec2: 2, vec3: 3, vec4: 4, mat2: 4, mat3: 9, mat4: 16};

  function drawArrays({program, count, attributes={}, uniforms={}, mode=gl.TRIANGLES, first=0}) {
    gl.useProgram(program.program);

    for (let name in attributes) {
      const a = attributes[name];
      const {index, type} = program.attributes[name];
      gl.bindBuffer(gl.ARRAY_BUFFER, a.buffer);
      gl.vertexAttribPointer(index, sizes[type], a.type, a.normalized, a.stride, a.offset);
      // TODO: handle const
    }

    let texture = 0;
    for (let name in uniforms) {
      const value = uniforms[name];
      const {index, type} = program.uniforms[name];
      if (type == 'float') {
        console.assert(typeof value == 'number');
        gl.uniform1f(index, value);
      } else if (type == 'vec2') {
        console.assert(value.length == 2);
        gl.uniform2fv(index, value);
      } else if (type == 'vec3') {
        console.assert(value.length == 3);
        gl.uniform3fv(index, value);
      } else if (type == 'vec4') {
        console.assert(value.length == 4);
        gl.uniform4fv(index, value);
      } else if (type == 'mat2') {
        console.assert(value.length == 4);
        gl.uniformMatrix2fv(index, value);
      } else if (type == 'mat3') {
        console.assert(value.length == 9);
        gl.uniformMatrix3fv(index, value);
      } else if (type == 'mat4') {
        console.assert(value.length == 16);
        gl.uniformMatrix4fv(index, value);
      } else if (type == 'sampler2D') {
        console.assert(value.constructor == WebGLTexture);
        gl.uniform1i(index, texture);
        gl.activeTexture(gl.TEXTURE0 + texture);
        gl.bindTexture(gl.TEXTURE_2D, value);
        texture++;
      } else {
        throw `Unknown type "${type}" for variable "${name}"`;
      }
    }

    gl.drawArrays(mode, first, count);
  }

  function createBuffer(data, hint=gl.STATIC_DRAW) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, hint);
    return buffer;
  }

  function createTexture({target=gl.TEXTURE_2D, mag=gl.NEAREST_MIPMAP_LINEAR, min=gl.NEAREST_MIPMAP_LINEAR, wrap=[gl.REPEAT, gl.REPEAT, gl.REPEAT]}={}) {
    const texture = gl.createTexture();
    gl.bindTexture(target, texture)
    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, mag);
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, min);
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, wrap[0]);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, wrap[1]);
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

  function texImage2D({texture, image, level=0, internalFormat=gl.RGBA, format=gl.RGBA, type=gl.UNSIGNED_BYTE}) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, format, type, image);
    return texture;
  }

  function createRenderTargets({width, height, count=1, internalFormat=gl.RGBA, format=gl.RGBA, type=gl.UNSIGNED_BYTE, depth_buffer=false}) {
    let targets = {textures: [], depth: null};
    for (let i=0; i<count; i++) {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);
      targets.textures.push(texture);
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

  return {createProgram, createBuffer, createTexture, loadImages, texImage2D, Attribute, drawArrays, createRenderTargets, bindRenderTargets};
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
}
