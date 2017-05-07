uniform sampler2D waterMap_0;
uniform sampler2D waterMap_1;
uniform sampler2D waterMap_2;

#include "util.glsl"

const float water::inv_scale = 18.0 * util::PI;
const float water::scale = 1.0 / water::inv_scale;
const float water::debug_scale = 1.;

// dynamics: pos * 4, t * 2

float water::height(vec2 pos[6]) {
  return water::debug_scale*(
    texture(waterMap_0, pos[0]).a +
    texture(waterMap_0, pos[1]).a +
    texture(waterMap_1, pos[2]).a +
    texture(waterMap_1, pos[3]).a +
    texture(waterMap_2, pos[4]).a +
    texture(waterMap_2, pos[5]).a +
    0.0);
}

vec3 water::normal(vec2 pos[6]) {
  return (
      -1.0 + 2.0 * texture(waterMap_0, pos[0]).rgb +
      -1.0 + 2.0 * texture(waterMap_0, pos[1]).rgb +
      -1.0 + 2.0 * texture(waterMap_1, pos[2]).rgb +
      -1.0 + 2.0 * texture(waterMap_1, pos[3]).rgb +
      -1.0 + 2.0 * texture(waterMap_2, pos[4]).rgb +
      -1.0 + 2.0 * texture(waterMap_2, pos[5]).rgb +
      0.0);
}

vec2[6] water::pos(vec2 pos, float time) {
  vec2 t = vec2(0, time);
  float PI2 = util::PI*0.5;
  return vec2[6](
    water::scale * (pos + 1.00*t),
    water::scale * (pos - 1.01*t + PI2),
    water::scale * (pos + 0.50*t),
    water::scale * (pos - 0.51*t + PI2),
    water::scale * (pos + 0.25*t),
    water::scale * (pos - 0.26*t + PI2)
  );
}

//  float pi2 = util::PI*0.5;
//  float s = sin(2.0*util::PI/3.1);
//  float c = cos(2.0*util::PI/3.1);
//  mat2 r = mat2(c, -s, s, c);
//  float t = 100.0*time;
//  float h = 0.0;
//  h += 1.00*sharp(0.25*pos, 0.4*t);
//  h += 1.00*sharp(0.25*pos+pi2, -0.4*t);
//  h += 0.25*sharp(1.0*pos, 0.8*t);
//  h += 0.25*sharp(1.0*pos+pi2, -0.8*t);
//  h += 0.061*soft(4.0*pos, 1.6*t);
//  h += 0.061*soft(4.0*pos+pi2, -1.6*t);
//  h += 0.015*soft(16.0*pos, 3.2*t);
//  h += 0.015*soft(16.0*pos+pi2, -3.2*t);
//
//  h += 0.25*wave(pos, 0.8*t);
//  h += 0.25*wave(r*pos, 0.8*t);
//  h += 0.25*wave(r*r*pos, 0.8*t);
