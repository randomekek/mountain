const gl = document.querySelector('#canvas').getContext('webgl2'), ezgl = Ezgl(gl);

gl.clearColor(0.58, 0.63, 0.81, 1.0);

gl.enable(gl.CULL_FACE);
gl.frontFace(gl.CCW);
gl.cullFace(gl.BACK);

gl.enable(gl.DEPTH_TEST);
gl.depthMask(true);
gl.depthFunc(gl.LESS);
gl.depthRange(0.0, 1.0);

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

let model = mat4.create();
let view = mat4.create();
let projection = mat4.create();
let axis_model = mat4.create();
let rotX = 0
let rotY = 0;

document.body.onmousemove = function(event) {
  rotX = (event.clientX / document.body.offsetWidth - 0.5) * Math.PI * 2;
  rotY = (event.clientY / document.body.offsetHeight - 0.5) * Math.PI;
}

const terrain = ezgl.createProgram({
  vertex: `
    uniform float gridSpacing;
    uniform int gridCount;
    uniform float heightScale;
    uniform float time;
    uniform sampler2D noise;
    uniform mat4 model;  // model space -> world space (move the object)
    uniform mat4 view;  // world space -> view space (move the camera)
    uniform mat4 projection;  // view space -> clip space (project into perspective)
    flat out int vid;
    out vec3 normal;
    vec2 plane(int id) {
      int x = id / gridCount;
      float z = float(id % gridCount) + 0.5 * (float(x % 2) - 1.0);
      return vec2(0.8660 * float(x), -z);
    }
    float height(vec2 pos) {
      // return heightScale*texture(noise, pos*0.12+vec2(time,0.0)).x;
      return heightScale*sin(pos.x)*sin(pos.y);
    }
    vec3 getNormal(vec2 pos) {
      float delta = 0.1;
      vec2 off = vec2(delta, 0.0);
      float x1 = height(pos - off);
      float x2 = height(pos + off);
      float y1 = height(pos - off.yx);
      float y2 = height(pos + off.yx);
      return vec3(x1 - x2, 2.0 * delta, y1 - y2);
    }
    void main() {
      vec2 pos = gridSpacing * plane(gl_VertexID);
      gl_Position = projection * view * model * vec4(pos.x, height(pos), pos.y, 1.0);
      vid = gl_VertexID;
      normal = getNormal(pos);
    }`,
  fragment: `
    out vec4 fragColor;
    flat in int vid;
    in vec3 normal;
    uniform vec3 light;
    void main() {
      vec3 baseColor = vec3(fract(float(vid) * 97./59.), 0.8, 0.4);
      float shading = max(0.0, dot(normalize(light), normalize(normal)));
      fragColor = vec4(shading*baseColor, 1.0);
    }`
});

const lines = ezgl.createProgram({
  vertex: `
    in vec3 point;
    in vec3 color;
    flat out vec3 vertColor;
    uniform mat4 model;
    uniform mat4 view;
    uniform mat4 projection;
    void main() {
      gl_Position = projection * view * model * vec4(point, 1.0);
      vertColor = color + vec3(0.4);
    }`,
  fragment: `
    flat in vec3 vertColor;
    out vec4 fragColor;
    void main() {
      fragColor = vec4(vertColor, 1.0);
    }`
});

ezgl.loadImages({ noise_img: 'tex16.png' }, ({noise_img}) => {
  const noise = ezgl.texImage2D(noise_img);
  const gridCount = 50;
  const gridSpacing = 0.2;
  const triangles = ezgl.createElementArrayBuffer(planeTriangles(gridCount));
  mat4.perspective(projection, Math.PI * 0.3, canvas.offsetWidth / canvas.offsetHeight, 1, 2*gridCount*gridSpacing)
  mat4.translate(model, model, [-0.5*0.8660*gridCount*gridSpacing, 0, 0.5*(gridCount-1.5)*gridSpacing])

  const axisPoints = ezgl.AttributeArray({
    size: 3,
    data: new Float32Array([
      0, 0, 0,
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ])});
  const axisLines = ezgl.createElementArrayBuffer(new Uint32Array([0, 1, 0, 2, 0, 3]));

  function render() {
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    mat4.identity(view);
    mat4.translate(view, view, [0, 0, -10]);
    mat4.rotateX(view, view, rotY);
    mat4.rotateY(view, view, rotX);

    ezgl.bind(terrain, {
      gridCount,
      gridSpacing,
      noise,
      heightScale: 1.0,
      time: (Date.now() % 10000) / 1000000,
      light: [1, 1, 1],
      model, view, projection,
    });
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangles);
    gl.drawElements(gl.TRIANGLE_STRIP, (2*gridCount+1)*gridCount, gl.UNSIGNED_INT, 0);

    ezgl.bind(lines, {
      point: axisPoints,
      color: axisPoints,
      model: axis_model, view, projection,
    });
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, axisLines);
    gl.drawElements(gl.LINES, 6, gl.UNSIGNED_INT, 0);
  }

  setInterval(render, 1000/30);
});
