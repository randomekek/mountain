uniform float heightScale;
uniform sampler2D heightMap;
uniform float spacingPerGrass;
uniform int grassInstanceSide;
uniform vec2 grassSize;
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

in vec2 grassVertex;

flat out int vid;
out vec3 position;

float height(vec2 pos) {
  return heightScale*texture(heightMap, pos*0.02).x;
}


float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453);
}

vec3 vertex(int id, int instance) {
  vec2 pos = spacingPerGrass * vec2(float(instance / grassInstanceSide), -float(instance % grassInstanceSide));
  vec2 offset = spacingPerGrass * vec2(rand(vec2(1.0, float(instance))), rand(vec2(float(instance), 1.0)));
  pos += offset;
  float h = height(pos) + grassSize.y * grassVertex.y;
  vec4 bottom4 = view * model * vec4(pos.x, h, pos.y, 1.0);
  vec3 bottom = bottom4.xyz / bottom4.w;
  vec4 top4 = view * model * vec4(pos.x, h + 1.0, pos.y, 1.0);
  vec3 top = top4.xyz / top4.w;
  vec3 up = top - bottom;
  vec3 toView = -bottom;
  vec3 perpendicular = transpose(mat3(view)) * grassSize.x * grassVertex.x * normalize(cross(up, toView));
  return vec3(pos.x, h, pos.y) + perpendicular;
}

void main() {
  vec3 pos = vertex(gl_VertexID, gl_InstanceID);
  vec4 position4 = view * model * vec4(pos, 1.0);
  position = position4.xyz / position4.w;
  gl_Position = projection * position4;
  vid = gl_VertexID;
}
