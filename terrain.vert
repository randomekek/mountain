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

in float landDummyAttribute;

out vec3 uNormal;
out vec3 position;
out float water;
out vec2 pos;

#include "util.glsl"
#include "water.glsl"
#include "terrain.glsl"

vec2 plane(int id) {
  int x = id / gridCount;
  float z = float(id % gridCount) + 0.5 * (float(x % 2) - 1.0);
  return vec2(0.8660 * float(x), -z);
}

void main() {
  pos = gridSpacing * plane(gl_VertexID);
  float h = terrain::height(pos);
  vec4 position4;
  if (h > waterLevel) {
    position4 = view * model * vec4(pos.x, h, pos.y, 1.0);
    uNormal = mat3(view) * terrain::normal(pos);
    water = 0.0;
  } else {
    h = /* waterLevel + */ water::height(pos, time);
    uNormal = mat3(view) * water::normal(pos, time);
    position4 = view * model * vec4(pos.x, h, pos.y, 1.0);
    water = 1.0;
  }
  position = position4.xyz / position4.w;
  gl_Position = projection * position4 + landDummyAttribute;
}
