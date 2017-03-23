uniform float heightScale;
uniform sampler2D heightMap;
uniform float spacingPerGrass;
uniform int grassInstanceSide;
uniform vec2 grassSize;
uniform float grassRotate;
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

in vec2 grassVertex;

flat out int vid;
flat out float grassId;
out vec3 position;
out float grassHeight;

float rand1(float x) { return fract(sin(x * 12.9898 + 1.0) * 43758.5453); }
float rand2(float x) { return fract(sin(x * 78.233 + 1.0) * 43758.5453); }

float height(vec2 pos) {
  return heightScale*texture(heightMap, pos*0.02).x;
}

vec3 vertex(int id, int instance) {
  vec2 vertex = grassSize * grassVertex;

  float finst = float(instance);
  vec2 gridPos = vec2(float(instance / grassInstanceSide), -float(instance % grassInstanceSide));
  vec2 randPos = vec2(rand1(finst), rand2(finst));
  vec2 pos = spacingPerGrass * (gridPos + randPos);
  float deg = vertex.y * grassRotate * mix(0.7, 1.0, rand1(finst));
  float rot = rand2(finst);
  vec3 up = vec3(sin(deg)*sin(rot), cos(deg), sin(deg)*cos(rot)) * mix(0.6, 1.0, rand1(finst));

  vec3 base = vec3(pos.x, 0, pos.y) + vertex.y * up;
  vec3 ground = vec3(0, height(pos), 0);
  vec3 baseWorld = mat3(model) * base + model[3].xyz + view[3].xyz * mat3(view);
  vec3 perpendicular = vertex.x * mix(1.0, 0.6, grassVertex.y/6.0) * normalize(cross(up, baseWorld));

  return base + ground + perpendicular;
}

void main() {
  vec3 pos = vertex(gl_VertexID, gl_InstanceID);
  vec4 position4 = view * model * vec4(pos, 1.0);
  position = position4.xyz / position4.w;
  gl_Position = projection * position4;
  vid = gl_VertexID;
  grassId = float(gl_InstanceID);
  grassHeight = grassVertex.y;
}
