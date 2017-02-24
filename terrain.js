(function() {

const gl = document.querySelector('#canvas').getContext('webgl2'), ezgl = Ezgl(gl);

gl.clearColor(0.6, 0.6, 0.9, 1.0);

function planeTriangles(n) {
  var triangles = new Uint32Array((2*n+1)*n);
  let j = 0, a = 0, incr = 1;
  for (let row=0; row<n; row++) {
    for (let col=0; col<n; col++) {
      triangles[j++] = a;
      triangles[j++] = a + n;
      a += incr;
    }
    a += n - incr;
    triangles[j++] = a;
    incr = -incr;
  }
  return triangles;
}

function terrain(baseNoise, gridCount) {
  ezgl.bind(terrain.program, {
    gridCount,
    gridSpacing: 100,
    baseNoise,
    camera: [0, 0, 0],
  });
  const triangles = ezgl.createElementArrayBuffer(planeTriangles(gridCount));
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangles);
  gl.drawElements(gl.LINE_STRIP, (2*gridCount+1)*gridCount - 2, gl.UNSIGNED_INT, 0);
}

terrain.program = ezgl.createProgram({
  vertex: `
    uniform float gridSpacing;
    uniform float gridCount;
    uniform sampler2D baseNoise;
    uniform vec3 camera;
    vec2 plane(float id) {
      float row = id / gridCount;
      float col = mod(id, gridCount);
      return vec2(0.5*row, col + mod(row, 2.0) - 0.5);
    }
    void main() {
      vec2 xy = gridSpacing * plane(float(gl_VertexID));
      vec3 vertex = vec3(xy.x, texture(baseNoise, xy).x, xy.y);
      gl_Position = vec4(vertex, 0.0); // cameraTransform(vertex);
    }`,
  fragment: `
    out vec4 fragColor;
    void main() {
      fragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }`
});

ezgl.loadImages({ noise_img: 'tex16.png' }, ({noise_img}) => {
  const noise = ezgl.texImage2D(noise_img);
  terrain(noise, 100);
});

} ());
