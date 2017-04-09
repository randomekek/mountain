uniform sampler2D noise;

const float util::PI = 3.1415926535897932384626433832795;

float util::pow2(float x) {
  return x*x;
}

float util::rand1(float x) {
  return fract(sin(x * 12.9898 + 1.0) * 43758.5453);
}

float util::rand2(float x) {
  return fract(sin(x * 78.233 + 1.0) * 43758.5453);
}

vec2 util::noise(vec2 a) {
  vec3 x = vec3(a, 0.0);
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f*f*(3.0-2.0*f);
  vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;
  vec4 rg = texture(noise, (uv + 0.5)/256.0);
  return -1.0+2.0*mix(vec2(rg.y, rg.w), vec2(rg.x, rg.z), f.z);
}
