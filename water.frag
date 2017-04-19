in vec2 pos;

out vec4 fragColor;

#include "util.glsl"
#include "water.glsl"

float sharp(vec2 pos) {
  pos = pos + 2.0*util::noise(0.2*pos);
  return (0.5+0.5*sin(pos.x))*(1.0-abs(sin(0.5*pos.y)));
}

float soft(vec2 pos) {
  pos = pos + util::noise(pos);
  return 0.5+0.5*sin(pos.y)*sin(pos.x);
}

float line(vec2 pos) {
  pos += 0.2 * util::noise(pos);
  return pow(1.0 - abs(sin(pos.x)*sin(pos.y)), 0.8) - 0.5;
}

float height(vec2 pos) {
  return (
    //0.5 + 0.5 *sin(pos.x)*sin(pos.y) +
    0.5*sharp(pos) +
    0.5*sharp(-pos + vec2(38.8, 60.5)) +
    0.0);
}

vec3 normal(vec2 pos) {
  float delta = 0.1;
  vec2 off = vec2(delta, 0.0);
  float x1 = height(pos - off);
  float x2 = height(pos + off);
  float y1 = height(pos - off.yx);
  float y2 = height(pos + off.yx);
  return 0.5 + 0.5 * vec3(1,1,-1) * normalize(vec3(x1 - x2, 2.0 * delta, y1 - y2));
}

void main() {
  vec2 scaledPos = (0.5 + 0.5 * pos) * water::inv_scale;
  fragColor = vec4(normal(scaledPos), height(scaledPos));  // normals encoded in [0-1]
}
