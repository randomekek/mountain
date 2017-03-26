uniform float heightScale;
uniform float landScale;
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
out vec3 uNormal;

float rand1(float x) { return fract(sin(x * 12.9898 + 1.0) * 43758.5453); }
float rand2(float x) { return fract(sin(x * 78.233 + 1.0) * 43758.5453); }

float height(vec2 pos) {
  return heightScale*texture(heightMap, pos*landScale).x;
  //return heightScale*sin(pos.x)*sin(pos.y);
}

vec3 vertex(int id) {
  vec2 vertex = grassSize * grassVertex;

  vec2 gridPos = grassGrid * vec2(1, -1);
  grassId = 0.002 * (grassGrid.x * grassInstanceSide + grassGrid.y);
  vec2 randPos = vec2(rand1(grassId), rand2(grassId));
  vec2 pos = spacingPerGrass * (gridPos + randPos);
  float bendStrength = grassRotate * (0.3 + 0.2 * sin(2.3 * (time + 0.07 * grassGrid.y + 0.3 * rand2(grassId))));
  float deg = (0.2 + grassVertex.y/5.0) * bendStrength * mix(0.7, 1.0, rand1(grassId));
  float rot = mix(-0.1, 0.1, rand2(grassId));
  vec3 up = vec3(sin(deg)*sin(rot), cos(deg), sin(deg)*cos(rot)) * mix(0.6, 1.0, rand1(grassId));

  vec3 base = vec3(pos.x, 0, pos.y) + vertex.y * up;
  vec3 ground = vec3(0, height(pos), 0);
  vec3 baseWorld = mat3(model) * base + model[3].xyz + view[3].xyz * mat3(view);
  vec3 perpendicular = mix(1.0, 0.4, grassVertex.y/5.0) * normalize(cross(up, baseWorld));
  uNormal = normalize(cross(up, perpendicular));

  return base + ground + vertex.x * perpendicular;
}

void main() {
  vec3 pos = vertex(gl_VertexID);
  vec4 position4 = view * model * vec4(pos, 1.0);
  position = position4.xyz / position4.w;
  gl_Position = projection * position4;
  vid = gl_VertexID;
  grassHeight = grassVertex.y/5.0;
}
