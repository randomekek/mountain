#include "util.glsl"

vec2 water_noise(vec2 a) {
  vec3 x = vec3(a, 0.0);
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f*f*(3.0-2.0*f);
  vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;
  vec4 rg = texture(noise, (uv + 0.5)/256.0);
  return -1.0+2.0*mix(vec2(rg.x, rg.z), vec2(rg.y, rg.w), f.z);
}

float water_wave(vec2 pos, float t) {
  float choppy = 0.8;
  pos = pos + vec2(0, t);
  pos += 0.2 * water_noise(pos);
  return pow(1.0 - abs(sin(pos.x)*sin(0.4*pos.y)), choppy) - 0.5;
}

float water_sharp(vec2 pos, float t) {
    pos = pos + vec2(0, t);
    pos = pos + water_noise(pos);
    return (0.5+0.5*sin(1.5*pos.x))*(1.0-abs(sin(pos.y)));
}

float water_soft(vec2 pos, float t) {
    pos = pos + vec2(0, t);
    pos = pos + water_noise(pos);
    return 0.5+0.5*sin(pos.y)*sin(pos.x);
}

float water_height(vec2 pos, float time) {
  float pi2 = PI*0.5;
  float s = sin(2.0*PI/3.1);
  float c = cos(2.0*PI/3.1);
  mat2 r = mat2(c, -s, s, c);
  float t = 100.0*time;
  return 1.5*(
    1.00*water_sharp(0.25*pos, 0.4*t) +
    // 1.00*water_sharp(0.25*pos+pi2, -0.4*t) +
    // 0.25*water_wave(pos, 0.8*t) +
    // 0.25*water_wave(r*pos, 0.8*t) +
    // 0.25*water_wave(r*r*pos, 0.8*t) +
    // 0.25*water_sharp(1.0*pos, 0.8*t) +
    // 0.25*water_sharp(1.0*pos+pi2, -0.8*t) +
    // 0.061*water_soft(4.0*pos, 1.6*t) +
    // 0.061*water_soft(4.0*pos+pi2, -1.6*t) +
    // 0.015*water_soft(16.0*pos, 3.2*t) +
    0.015*water_soft(16.0*pos+pi2, -3.2*t));
}

vec3 water_normal(vec2 pos, float time) {
  float delta = 0.1;
  vec2 off = vec2(delta, 0.0);
  float x1 = water_height(pos - off, time);
  float x2 = water_height(pos + off, time);
  float y1 = water_height(pos - off.yx, time);
  float y2 = water_height(pos + off.yx, time);
  return vec3(x1 - x2, 2.0 * delta, y1 - y2);
}
