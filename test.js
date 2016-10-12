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
      vec3 r = texture2D(rendered, 0.5 + 0.5*mesh_pos).rgb;
      vec3 n = texture2D(noise, floor(mesh_pos*3.0)/256.0).rgb;
      gl_FragColor = vec4(mix(r, n, 0.5 + 0.5 * sin(time)), 1.0);
    }`});

const vertexBuffer = ezgl.createBuffer(new Float32Array([
    -1.0,  1.0, // TL
    -1.0, -1.0, // BL
     1.0,  1.0, // TR
     1.0, -1.0, // BR
]));

ezgl.loadImages({ noise_img: 'tex16.png' }, ({noise_img}) => {
  const mirrored = [gl.MIRRORED_REPEAT, gl.MIRRORED_REPEAT]
  const noise = ezgl.texImage2D({
    image: noise_img,
    texture: ezgl.createTexture({wrap: mirrored}),
  });
  const renderTargets = ezgl.createRenderTargets({
    width: 50, height: 50,
    textures: [ezgl.createTexture({wrap: mirrored})],
  });

  function drawScene() {
    ezgl.bindRenderTargets(renderTargets);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    ezgl.bind(shadertoy, {
      position: ezgl.AttributeArray({ buffer: vertexBuffer }),
      size: [50, 50],
    });
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    ezgl.bind(program, {
      position: ezgl.AttributeArray({ buffer: vertexBuffer }),
      time: [Date.now()/1000.0 % 100],
      rendered: renderTargets.textures[0],
      noise,
      size: [200, 100],
    });
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  const refresh = true ? setInterval(drawScene, 1000/60) : drawScene();
});

} ());
