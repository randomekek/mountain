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
let axisModel = mat4.create();
let rotX = 0
let rotY = 0;
let isRender = true;
let origin = vec3.create();
let light = vec3.create();
let lightView = vec3.create();

const gridCount = 50;
const gridSpacing = 0.2;
const triangles = ezgl.createElementArrayBuffer(planeTriangles(gridCount));
mat4.perspective(projection, Math.PI * 0.3, canvas.offsetWidth / canvas.offsetHeight, 1, 2*gridCount*gridSpacing)
mat4.translate(model, model, [-0.5*0.8660*gridCount*gridSpacing, 0, 0.5*gridCount*gridSpacing])

const axisPoints = ezgl.AttributeArray({
  size: 3,
  data: new Float32Array([
    0, 0, 0,
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
  ])});
const axisLines = ezgl.createElementArrayBuffer(new Uint32Array([0, 1, 0, 2, 0, 3]));

document.body.onmousemove = function(event) {
  rotX = (event.clientX / document.body.offsetWidth - 0.5) * Math.PI * 2;
  rotY = (event.clientY / document.body.offsetHeight - 0.5) * Math.PI;
}

document.body.onmousedown = function(event) {
  isRender = !isRender;
}

const terrain = ezgl.createProgram({
  vertex: `
    uniform float gridSpacing;
    uniform int gridCount;
    uniform float heightScale;
    uniform float time;
    uniform sampler2D noise;
    uniform mat4 model;
    uniform mat4 view;
    uniform mat4 projection;
    flat out int vid;
    out vec3 uNormal;
    out vec3 position;
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
      vec4 position4 = view * model * vec4(pos.x, height(pos), pos.y, 1.0);
      position = position4.xyz / position4.w;
      gl_Position = projection * position4;
      vid = gl_VertexID;
      uNormal = mat3(view) * getNormal(pos);
    }`,
  fragment: `
    out vec4 fragColor;
    flat in int vid;
    in vec3 uNormal;
    in vec3 position;
    uniform vec3 light;
    void main() {
      vec3 toLight =  normalize(light - position);
      vec3 normal = normalize(uNormal);
      float diffuse = clamp(dot(toLight, normal), 0.0, 1.0);
      vec3 halfway = normalize(toLight - normalize(position));
      float specular =  diffuse > 0.0 ? pow(max(0.0, dot(halfway, normal)), 11.0) : 0.0;
      vec3 baseColor = 0.7*vec3(fract(float(vid) * 97./463.), 0.8, 0.4);
      fragColor = vec4((1.0*diffuse + 1.0*specular)*baseColor, 1.0);
    }`
});

const identity = ezgl.createProgram({
  vertex: `
    in vec3 point;
    in vec3 color;
    flat out vec3 vertColor;
    uniform mat4 model;
    uniform mat4 view;
    uniform mat4 projection;
    void main() {
      gl_Position = projection * view * model * vec4(point, 1.0);
      gl_PointSize = 11.0;
      vertColor = color + vec3(0.4);
    }`,
  fragment: `
    flat in vec3 vertColor;
    out vec4 fragColor;
    void main() {
      fragColor = vec4(vertColor, 1.0);
    }`
});

ezgl.loadImages({ noiseImg: 'tex16.png' }, ({noiseImg}) => {
  const noise = ezgl.texImage2D(noiseImg);

  function render() {
    if(!isRender) {
      return;
    }
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    mat4.identity(view);
    mat4.translate(view, view, [0, 0, -10]);
    mat4.rotateX(view, view, rotY);
    mat4.rotateY(view, view, rotX);

    vec3.set(light, 2, 1, 0);
    vec3.rotateY(light, light, origin, (2*Date.now()/1000) % (2 * Math.PI));
    vec3.transformMat4(lightView, light, view);

    ezgl.bind(terrain, {
      gridCount,
      gridSpacing,
      noise,
      heightScale: 1.0,
      time: (Date.now() % 10000) / 1000000,
      light: lightView,
      model, view, projection,
    });
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangles);
    gl.drawElements(gl.TRIANGLE_STRIP, (2*gridCount+1)*gridCount, gl.UNSIGNED_INT, 0);

    ezgl.bind(identity, {
      point: axisPoints,
      color: axisPoints,
      model: axisModel, view, projection,
    });
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, axisLines);
    gl.drawElements(gl.LINES, 6, gl.UNSIGNED_INT, 0);

    ezgl.bind(identity, {
      point: light,
      color: [0.9, 0.9, 0.9],
      model: axisModel, view, projection,
    });
    gl.drawArrays(gl.POINTS, 0, 1);
  }

  setInterval(render, 1000/30);
});
