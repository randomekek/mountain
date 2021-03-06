// TODO:
// * structured terrain
//   * water
//   * sand
//   * grass
//   * trees
//   * snow
// * render further
// * environment map
// * camera control

const canvas = document.querySelector('#canvas');
const gl = canvas.getContext('webgl2'), ezgl = Ezgl(gl);

gl.clearColor(0.0, 0.0, 0.0, 1.0);

gl.enable(gl.CULL_FACE);
gl.frontFace(gl.CCW);
gl.cullFace(gl.BACK);

gl.enable(gl.DEPTH_TEST);
gl.depthMask(true);
gl.depthFunc(gl.LESS);
gl.depthRange(0.0, 1.0);

let model = mat4.create();
let view = mat4.create();
let projection = mat4.create();
let axisModel = mat4.create();
let rotX = 0, rotY = 0;
let isRender = true;
let origin = vec3.create();
let light = vec3.create();
let lightView = vec3.create();
let tpf = 0, start = Date.now();

const gridCount = 150;
const gridSpacing = 0.2;
const offset = 6;
const heightScale = 9.0;
const landScale = 0.005;
const grassSegments = 5;
const grassInstanceSide = 200;
const grassSize = [0.03, 1.3 / grassSegments];
const grassRotate = 0.1 * Math.PI;
let waterLevel = 4.1;

const landTriangles = ezgl.createBuffer(planeTriangles(gridCount), {type: gl.ELEMENT_ARRAY_BUFFER});
const landDummyAttribute = ezgl.AttributeArray({ size: 1, data: new Float32Array((2*gridCount+1)*gridCount) });
const grassTriangles = ezgl.createBuffer(lineTriangles(grassSegments), {type: gl.ELEMENT_ARRAY_BUFFER});
const grassVertex = ezgl.AttributeArray({ size: 2, divisor: 0, data: new Float32Array([ -1, 0, 1, 0, -1, 1, 1, 1, -1, 2, 1, 2, -1, 3, 1, 3, -1, 4, 1, 4, -1, 5, 1, 5, -1, 6, 1, 6]) });
const grassRand = ezgl.AttributeArray({ size: 4, divisor: 1, data: rands(4 * grassInstanceSide * grassInstanceSide) });
const grassGrids = [
  ezgl.AttributeArray({ size: 2, divisor: 1, data: gridPoints(grassInstanceSide, 0) }),
  ezgl.AttributeArray({ size: 2, divisor: 1, data: gridPoints(grassInstanceSide, 1) }),
  ezgl.AttributeArray({ size: 2, divisor: 1, data: gridPoints(grassInstanceSide, 2) }),
  ezgl.AttributeArray({ size: 2, divisor: 1, data: gridPoints(grassInstanceSide, 3) }),
];
const axisLines = ezgl.createBuffer(new Uint32Array([0, 1, 0, 2, 0, 3]), {type: gl.ELEMENT_ARRAY_BUFFER});
const viewport = ezgl.AttributeArray({
  size: 2,
  data: new Float32Array([ -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, -1.0 ])
});
const axisPoints = ezgl.AttributeArray({
  size: 3,
  data: new Float32Array([ 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1 ])
});

mat4.perspective(projection, Math.PI * 0.3, canvas.clientWidth / canvas.clientHeight, 1, 2*gridCount*gridSpacing+offset);
mat4.translate(model, model, [-0.5*0.8660*gridCount*gridSpacing, -1, 0.5*gridCount*gridSpacing]);

ezgl.load(['tex16.png', 'terrain.vert', 'terrain.frag', 'screen.vert', 'sky.frag', 'fbm.frag', 'grass.vert', 'grass.frag', 'axis.vert', 'axis.frag', 'water.frag', 'water.glsl', 'util.glsl', 'terrain.glsl', 'show.frag'], r => {
  ezgl.library(r, ['water.glsl', 'util.glsl', 'terrain.glsl']);
  const noise = ezgl.texImage2D(r.tex16_png);
  const terrain = ezgl.createProgram(r.terrain_vert, r.terrain_frag);
  const sky = ezgl.createProgram(r.screen_vert, r.sky_frag);
  const fbm = ezgl.createProgram(r.screen_vert, r.fbm_frag);
  const grass = ezgl.createProgram(r.grass_vert, r.grass_frag);
  const identity = ezgl.createProgram(r.axis_vert, r.axis_frag);
  const water = ezgl.createProgram(r.screen_vert, r.water_frag);
  const show = ezgl.createProgram(r.screen_vert, r.show_frag);

  const heightMap = generateHeightMap(fbm, noise);
  const waterMap = generateWaterMaps(water, noise, 3);

  if (false) return showTexture(show, waterMap[0]);

  window.requestAnimationFrame(render);

  function render() {
    if(!isRender) {
      window.requestAnimationFrame(render);
      return;
    }
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

    mat4.identity(view);
    mat4.translate(view, view, [0, 0, -3*offset]);
    mat4.rotateX(view, view, rotY);
    mat4.rotateY(view, view, rotX);

    vec3.set(light, 5, 5, 0);
    vec3.rotateY(light, light, origin, (1.0*Date.now()/1000) % (2 * Math.PI));
    vec3.transformMat4(lightView, light, view);

    gl.depthMask(false);
    ezgl.bind(sky, {
      points: viewport,
      sun: [1, 1, -1],
      view, projection
    });
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.depthMask(true);

    gl.disable(gl.CULL_FACE);
    ezgl.bind(grass, {
      grassVertex,
      grassGrid: grassGrids[gridFacing(view)],
      spacingPerGrass: gridCount * gridSpacing / grassInstanceSide,
      grassRotate: grassRotate,
      grassRand,
      waterLevel,
      time: Date.now() % 100000 / 1000,
      grassInstanceSide,
      grassSize,
      heightMap, heightScale, landScale,
      light: lightView,
      model, view, projection,
    });
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, grassTriangles);
    gl.drawElementsInstanced(gl.TRIANGLE_STRIP, grassSegments*2+2, gl.UNSIGNED_SHORT, 0, grassInstanceSide * grassInstanceSide);
    gl.enable(gl.CULL_FACE);

    ezgl.bind(terrain, {
      landDummyAttribute,
      gridCount,
      gridSpacing,
      heightMap, heightScale, landScale,
      waterMap_0: waterMap[0], waterMap_1: waterMap[2], waterMap_2: waterMap[1], waterLevel,
      noise,
      time: (Date.now() % 100000) / 1000,
      light: lightView,
      light_world: light,
      model, view, projection,
    });
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, landTriangles);
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

    tpf = 0.9 * tpf + 0.1 * (Date.now() - start);
    start = Date.now();
    window.requestAnimationFrame(render);
  }
});


setInterval(function() {
  document.getElementById('tpf').innerText = 'tpf: ' + tpf.toFixed(0);
  document.getElementById('fps').innerText = 'fps: ' + (1000 / tpf).toFixed(0);
}, 500);

function planeTriangles(n) {
  // connect a plane of triangles
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

function lineTriangles(n) {
  // connect single strip of points
  var triangles = new Uint16Array(2*n+2);
  for (let row=0; row<2*n+2; row++) {
    triangles[row] = row;
  }
  return triangles;
}

function gridPoints(n, face) {
  // square grid spaced points, starting from face
  // face { 0: z=x, 1: z=-x, 2: z=z, 3: z=-z }
  var points = new Float32Array(2*n*n);
  let i = 0;
  for (let row=0; row<n; row++) {
    for (let col=0; col<n; col++) {
      if (face == 0) {
        points[i++] = row;
        points[i++] = col;
      } else if (face == 1) {
        points[i++] = n-row;
        points[i++] = col;
      } else if (face == 2) {
        points[i++] = col;
        points[i++] = row;
      } else if (face == 3) {
        points[i++] = col;
        points[i++] = n-row;
      }
    }
  }
  return points;
}

function gridFacing(view) {
  const x = view[8], z = view[10], ax = Math.abs(x), az = Math.abs(z);
  return ax > az ? (x > 0 ? 0 : 1) : (z > 0 ? 2 : 3);
}

function generateHeightMap(program, noise) {
  const renderTargets = ezgl.createRenderTargets({
    width: 512,
    height: 512,
    textures: [ezgl.createTexture()],
  });
  ezgl.bindRenderTargets(renderTargets);
  ezgl.bind(program, {
    points: viewport,
    noise,
  });
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
  return renderTargets.textures[0];
}

function generateWaterMaps(program, noise, octaves) {
  let results = [];
  for (let octave=0; octave<octaves; octave++) {
    const renderTargets = ezgl.createRenderTargets({
      width: 1024,
      height: 1024,
      textures: [ezgl.createTexture({wrap: [gl.REPEAT, gl.REPEAT]})],
    });
    ezgl.bindRenderTargets(renderTargets);
    ezgl.bind(program, {
      points: viewport,
      noise,
      octave,
    });
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    results.push(renderTargets.textures[0]);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
  return results;
}

function showTexture(program, tex) {
  ezgl.bind(program, {
    tex,
    points: viewport,
    screenSize: [canvas.clientWidth, canvas.clientHeight],
  });
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function rands(n) {
  let value = new Float32Array(n);
  for (let i=0; i<n; i++) {
    value[i] = Math.random();
  }
  return value;
}


document.body.onmousemove = function(event) {
  rotX = (event.clientX / document.body.offsetWidth - 0.5) * Math.PI * 2;
  rotY = (event.clientY / document.body.offsetHeight - 0.5) * Math.PI;
}

document.body.onmousedown = function(event) {
  isRender = !isRender;
}
