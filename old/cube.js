const canvas = document.querySelector('#canvas');
const gl = window.gl = canvas.getContext('webgl2'), ezgl = Ezgl(gl);

gl.clearColor(0.6, 0.6, 0.9, 1.0);

const vertices = ezgl.AttributeArray({
  size: 3,
  data: new Float32Array([
      0, 0, 0,
      1, 0, 0,
      0, 0, -1,
      0, 1, 0,
  ])
});

const indices = ezgl.createElementArrayBuffer(new Uint32Array([
    0, 1, 3,
    2, 3, 1,
    0, 3, 2,
    2, 1, 0,
]));

const program = ezgl.createProgram({
  vertex: `
    in vec3 vertex;
    out vec3 color;
    uniform mat4 model;  // model space -> world space (move the object)
    uniform mat4 view;  // world space -> view space (move the camera)
    uniform mat4 projection;  // view space -> clip space (project into perspective)
    void main() {
      gl_Position = projection * view * model * vec4(vertex, 1.0);
      color = gl_VertexID == 0 ? vec3(1.0, 0.0, 0.0) : gl_VertexID == 1 ? vec3(0.0, 1.0, 0.0) : gl_VertexID == 2 ? vec3(0.0, 0.0, 1.0) : vec3(1.0);
    }`,
  fragment: `
    out vec4 fragColor;
    in vec3 color;
    void main() {
      fragColor = vec4(color, 1.0);
    }`
});

let model = mat4.create();
let view = mat4.create();
let projection = mat4.create();
mat4.perspective(projection, Math.PI * 0.5, canvas.offsetWidth / canvas.offsetWidth, 1, 50)
let rotX = 0
let rotY = 0;
document.body.onmousemove = function(event) {
  rotX = (event.clientX / document.body.offsetWidth - 0.5) * Math.PI;
  rotY = (event.clientY / document.body.offsetHeight - 0.5) * Math.PI;
}

gl.enable(gl.CULL_FACE);
gl.frontFace(gl.CCW);
gl.cullFace(gl.BACK);

function render() {
  gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

  mat4.identity(view);
  mat4.translate(view, view, [0, 0, -2]);
  mat4.rotateX(view, view, rotY);
  mat4.rotateY(view, view, rotX);

  ezgl.bind(program, {
    vertex: vertices,
    model,
    view,
    projection,
  });
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
  gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_INT, 0);
}

render();
setInterval(render, 100);
