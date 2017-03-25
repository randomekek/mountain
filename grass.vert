uniform float heightScale;
uniform sampler2D heightMap;
uniform float spacingPerGrass;
uniform float grassInstanceSide;
uniform vec2 grassSize;
uniform float grassRotate;
uniform float time;
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

in vec2 grassVertex;
in vec2 grassGrid;

flat out int vid;
flat out float grassId;
out vec3 position;
out float grassHeight;

float rand1(float x) { return fract(sin(x * 12.9898 + 1.0) * 43758.5453); }
float rand2(float x) { return fract(sin(x * 78.233 + 1.0) * 43758.5453); }

float height(vec2 pos) {
  return heightScale*texture(heightMap, pos*0.02).x;
}

vec3 vertex(int id) {
  vec2 vertex = grassSize * grassVertex;

  vec2 gridPos = grassGrid * vec2(1, -1);
  float finst = 0.05 * (grassGrid.x * grassInstanceSide + grassGrid.y);
  vec2 randPos = vec2(rand1(finst), rand2(finst));
  vec2 pos = spacingPerGrass * (gridPos + randPos);
  float bendStrength = grassRotate * (0.3 + 0.2 * sin(time + 2.0 * grassGrid.y / grassInstanceSide + 0.3 * rand2(finst)));
  float deg = (0.2 + vertex.y/5.0) * bendStrength * mix(0.7, 1.0, rand1(finst));
  float rot = mix(-0.1, 0.1, rand2(finst));
  vec3 up = vec3(sin(deg)*sin(rot), cos(deg), sin(deg)*cos(rot)) * mix(0.6, 1.0, rand1(finst));

  vec3 base = vec3(pos.x, 0, pos.y) + vertex.y * up;
  vec3 ground = vec3(0, height(pos), 0);
  vec3 baseWorld = mat3(model) * base + model[3].xyz + view[3].xyz * mat3(view);
  vec3 perpendicular = vertex.x * mix(1.0, 0.6, grassVertex.y/5.0) * normalize(cross(up, baseWorld));

  return base + ground + perpendicular;
}

void main() {
  vec3 pos = vertex(gl_VertexID);
  vec4 position4 = view * model * vec4(pos, 1.0);
  position = position4.xyz / position4.w;
  gl_Position = projection * position4;
  vid = gl_VertexID;
  grassId = float(grassGrid.x * grassInstanceSide + grassGrid.y);
  grassHeight = grassVertex.y/5.0;
}
