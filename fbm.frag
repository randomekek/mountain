uniform sampler2D noise;

in vec2 pos;

out vec4 fragColor;

float sampleNoise(in vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f*f*(3.0-2.0*f);
  vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;
  vec2 rg = texture(noise, (uv + 0.5)/256.0).yx;
  return -1.0+2.0*mix(rg.x, rg.y, f.z);
}

void main() {
  fragColor = vec4(0.0, 0.0, 0.0, 1.0);
  float scale = 0.25;
  vec3 pos = vec3(pos + 1.0, 0.0) * 10.0;
  for (int i=0; i<8; i++) {
    fragColor.xyz += scale * sampleNoise(pos);
    scale *= 0.5;
    pos *= 2.01;
  }
  fragColor.xyz += 0.5;
}
