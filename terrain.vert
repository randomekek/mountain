uniform float gridSpacing;
uniform int gridCount;
uniform float heightScale;
uniform float landScale;
uniform float time;
uniform float waterLevel;
uniform sampler2D heightMap;
uniform sampler2D noise;
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
const float PI = 3.1415926535897932384626433832795;

in float landDummyAttribute;

out vec3 uNormal;
out vec3 position;
out float water;

vec2 plane(int id) {
  int x = id / gridCount;
  float z = float(id % gridCount) + 0.5 * (float(x % 2) - 1.0);
  return vec2(0.8660 * float(x), -z);
}
float height(vec2 pos) {
  return heightScale*(texture(heightMap, pos*landScale).x - 0.5);
  //return heightScale*sin(pos.x)*sin(pos.y);
}
vec3 getNormal(vec2 pos) {
  float delta = 0.4;
  vec2 off = vec2(delta, 0.0);
  float x1 = height(pos - off);
  float x2 = height(pos + off);
  float y1 = height(pos - off.yx);
  float y2 = height(pos + off.yx);
  return vec3(x1 - x2, 2.0 * delta, y1 - y2);
}

vec2 sampleNoise(in vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f*f*(3.0-2.0*f);
  vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;
  vec4 rg = texture(noise, (uv + 0.5)/256.0);
  return -1.0+2.0*mix(vec2(rg.x, rg.z), vec2(rg.y, rg.w), f.z);
}
float waveHeight(vec2 pos) {
  pos *= 0.5;
  vec2 n = sampleNoise(vec3(pos, 0.0));
  pos += 0.5 * n;
  return pow(1.0-abs(sin(pos.x)), 5.0);
}

void main() {
  vec2 pos = gridSpacing * plane(gl_VertexID);
  float h = height(pos);
  vec4 position4;
  if (h > waterLevel) {
    position4 = view * model * vec4(pos.x, h, pos.y, 1.0);
    uNormal = mat3(view) * getNormal(pos);
    water = 0.0;
  } else {
    h = /* waterLevel + */ waveHeight(pos);
    position4 = view * model * vec4(pos.x, h, pos.y, 1.0);
    uNormal = view[1].xyz;
    water = 1.0;
  }
  position = position4.xyz / position4.w;
  gl_Position = projection * position4 + landDummyAttribute;
}
