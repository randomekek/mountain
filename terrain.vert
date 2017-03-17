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
  return heightScale*texture(noise, pos*0.004).x;
  //return heightScale*sin(pos.x)*sin(pos.y);
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
}
