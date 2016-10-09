(function() {

const gl = document.querySelector('#canvas').getContext('webgl2'), ezgl = Ezgl(gl);

const program = ezgl.createProgram(
  vertex=`
    precision mediump float;
    attribute vec2 position;

    void main () {
      gl_Position = vec4($perspective(position), 0, 1);
    }`,
  fragment=`
    precision mediump float;
    uniform float times;
    uniform sampler2D noise;

    void main () {
      vec3 n = texture2D(noise, gl_FragCoord.xy / 640.0).rgb;
      gl_FragColor = vec4(0.5 * (n + vec3(0.5 + 0.5 * sin(times))), 1.0);
    }`);

const vertexBuffer = ezgl.createBuffer(new Float32Array([
    -1.0,  1.0, // TL
    -1.0, -1.0, // BL
     1.0,  1.0, // TR
     1.0, -1.0, // BR
]));

const texture = ezgl.loadImageFromUrl({
  url: 'tex16.png',
  texture: ezgl.createTexture(),
});

function drawScene() {
  gl.clearColor(0.6, 0.6, 0.9, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  ezgl.drawArrays({
    program,
    count: 4,
    attributes: {
      position: ezgl.Attribute({ buffer: vertexBuffer }),
    },
    uniforms: {
      times: Date.now()/1000.0 % 100,
      noise: texture,
    },
    mode: gl.TRIANGLE_STRIP,
  });
}

const refresh = false ? setInterval(drawScene, 1000/60) : drawScene();

} ());
