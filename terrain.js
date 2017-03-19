// TODO:
// * more complex terrain
// * grass
// * render further
// * environment map
// * camera control

const gl = document.querySelector('#canvas').getContext('webgl2'), ezgl = Ezgl(gl);

gl.clearColor(0.0, 0.0, 0.0, 1.0);

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

const gridCount = 150;
const gridSpacing = 0.2;
const offset = 10;
const triangles = ezgl.createBuffer(planeTriangles(gridCount), {type: gl.ELEMENT_ARRAY_BUFFER});
mat4.perspective(projection, Math.PI * 0.3, canvas.clientWidth / canvas.clientHeight, 1, 2*gridCount*gridSpacing+offset);
mat4.translate(model, model, [-0.5*0.8660*gridCount*gridSpacing, 0, 0.5*gridCount*gridSpacing]);

const viewport = ezgl.AttributeArray({
  size: 2,
  data: new Float32Array([
    -1.0,  1.0, // TL
    -1.0, -1.0, // BL
     1.0,  1.0, // TR
     1.0, -1.0, // BR
  ])
});

const axisPoints = ezgl.AttributeArray({
  size: 3,
  data: new Float32Array([
    0, 0, 0,
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
  ])});
const axisLines = ezgl.createBuffer(new Uint32Array([0, 1, 0, 2, 0, 3]), {type: gl.ELEMENT_ARRAY_BUFFER});

document.body.onmousemove = function(event) {
  rotX = (event.clientX / document.body.offsetWidth - 0.5) * Math.PI * 2;
  rotY = (event.clientY / document.body.offsetHeight - 0.5) * Math.PI;
}

document.body.onmousedown = function(event) {
  isRender = !isRender;
}

function generateHeightMap(fbm, noise) {
  const renderTargets = ezgl.createRenderTargets({
    width: 512,
    height: 512,
    textures: [ezgl.createTexture()],
  });
  ezgl.bindRenderTargets(renderTargets);
  ezgl.bind(fbm, {
    points: viewport,
    noise,
  });
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return renderTargets.textures[0];
}

const identity = ezgl.createProgram(
  /*vertex*/`
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

  /*fragment*/`
  flat in vec3 vertColor;
  out vec4 fragColor;
  void main() {
    fragColor = vec4(vertColor, 1.0);
  }`);

ezgl.load(['tex16.png', 'terrain.vert', 'terrain.frag', 'screen.vert', 'sky.frag', 'fbm.frag', 'grass.vert', 'grass.frag'], r => {
  const noise = ezgl.texImage2D(r.tex16_png);
  const terrain = ezgl.createProgram(r.terrain_vert, r.terrain_frag);
  const sky = ezgl.createProgram(r.screen_vert, r.sky_frag);
  const fbm = ezgl.createProgram(r.screen_vert, r.fbm_frag);
  const heightMap = generateHeightMap(fbm, noise);

  setInterval(render, 1000/30);

  function render() {
    if(!isRender) {
      return;
    }
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    mat4.identity(view);
    mat4.translate(view, view, [0, 0, -offset]);
    mat4.rotateX(view, view, rotY);
    mat4.rotateY(view, view, rotX);

    vec3.set(light, 6, 3, 0);
    vec3.rotateY(light, light, origin, (0.6*Date.now()/1000) % (2 * Math.PI));
    vec3.transformMat4(lightView, light, view);

    gl.depthMask(false);
    ezgl.bind(sky, {
      points: viewport,
      sun: [1, 1, -1],
      view, projection
    });
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.depthMask(true);

    ezgl.bind(terrain, {
      gridCount,
      gridSpacing,
      heightMap,
      heightScale: 3.0,
      time: (Date.now() % 1000000) / 100000,
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
});
