in vec2 pos;

out vec4 fragColor;

#include "util.glsl"

void main() {
  fragColor = vec4(0.0, 0.0, 0.0, 1.0);
  float scale = 0.25;
  vec2 pos = 10.0 + 10.0*pos;
  for (int i=0; i<6; i++) {
    fragColor.xyz += scale * util::noise(pos).x;
    scale *= 0.5;
    pos *= 2.01;
  }
  fragColor.xyz += 0.5;
}
