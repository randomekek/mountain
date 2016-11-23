(function() {

const gl = document.querySelector('#canvas').getContext('webgl2'), ezgl = Ezgl(gl);
gl.clearColor(0.6, 0.6, 0.9, 1.0);

const shadertoy = ezgl.createProgram({
  vertex: `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0, 1);
    }`,
  fragment: `
    uniform vec2 size;
    void main() {
      gl_FragColor = vec4(gl_FragCoord.xy/size, 0.7, 1.0);
    }`});

const program = ezgl.createProgram({
  vertex: `
    attribute vec2 position;
    uniform sampler2D noise;
    uniform float time;
    varying vec2 mesh_pos;
    void main() {
      mesh_pos = 0.5 + 0.5 * position;
      vec2 n = texture2D(noise, 0.2 * mesh_pos).xy - 0.5;
      gl_Position = vec4(0.3 * (position + 0.9 * sin(time) * n), 0, 1);
    }`,
  fragment: `
    uniform float time;
    uniform sampler2D rendered;
    uniform sampler2D noise;
    uniform vec2 size;
    varying vec2 mesh_pos;
    void main() {
      vec3 r = texture2D(rendered, mesh_pos).rgb;
      vec3 n = texture2D(noise, floor(mesh_pos*3.0)/256.0).rgb;
      gl_FragColor = vec4(mix(r, n, 0.5 + 0.5 * sin(time)), 1.0);
    }`});

const entire_viewport = ezgl.AttributeArray({
  buffer: ezgl.createBuffer(new Float32Array([
    -1.0,  1.0, // TL
    -1.0, -1.0, // BL
     1.0,  1.0, // TR
     1.0, -1.0, // BR
  ]))
});

function showTexture(texture) {
  ezgl.bind(showTexture.program , {
    texture,
    position: entire_viewport,
  });
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

showTexture.program = ezgl.createProgram({
  vertex: `
    attribute vec2 position;
    varying vec2 uv;
    void main() {
      gl_Position = vec4(position, 0, 1);
      uv = 0.5 + 0.5 * position;  // texture coords are normalized
    }`,
  fragment: `
    uniform sampler2D texture;
    varying vec2 uv;
    void main() {
      gl_FragColor = texture2D(texture, uv);
    }`
});

function fbm(base_noise) {
  ezgl.bind(fbm.program, {
    base_noise,
    position: entire_viewport,
  });
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

fbm.program = ezgl.createProgram({
  vertex: `
    attribute vec2 position;
    varying vec2 uv;
    void main() {
      gl_Position = vec4(position, -0.1, 1);
      uv = 0.5 + 0.5 * position;
    }`,
  fragment: `
    uniform sampler2D base_noise;
    varying vec2 uv;
    float noise(in vec3 x) {
      vec3 p = floor(x);
      vec3 f = fract(x);
      f = f*f*(3.0-2.0*f);
      vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;
      vec2 rg = texture2D(base_noise, (uv + 0.5)/256.0).yx;
      return -1.0+2.0*mix(rg.x, rg.y, f.z);
    }
    void main() {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      float scale = 0.5;
      vec3 pos = vec3(uv, 0.0) * 2.;
      for (int i=0; i<8; i++) {
        gl_FragColor.x += scale * noise(pos);
        scale *= 0.5;
        pos *= 2.01;
      }
    }`
});

const mirrored = [gl.MIRRORED_REPEAT, gl.MIRRORED_REPEAT];

const renderTargets = ezgl.createRenderTargets({
  width: 17, height: 17,
  textures: [ezgl.createTexture({mag: gl.NEAREST, wrap: mirrored})],
});

ezgl.loadImages({ noise_img: 'tex16.png' }, ({noise_img}) => {
  const noise = ezgl.texImage2D({
    image: noise_img,
    texture: ezgl.createTexture({wrap: mirrored}),
  });

  function drawScene() {
    ezgl.bindRenderTargets(renderTargets);
    ezgl.bind(shadertoy, {
      position: entire_viewport,
      size: [17, 17],
    });
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    showTexture(renderTargets.textures[0], 50, 50);
    ezgl.bind(program, {
      position: entire_viewport,
      time: [Date.now()/1000.0 % 100],
      rendered: renderTargets.textures[0],
      noise,
      size: [200, 100],
    });
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  fbm(noise);
  const refresh = true ? setInterval(drawScene, 1000/60) : drawScene();
});

} ());
