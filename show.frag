uniform sampler2D tex;
uniform vec2 screenSize;

in vec2 pos;

out vec4 fragColor;

void main() {
  vec2 abs_pos = 0.5 + 0.5 * pos;
  vec2 xy = vec2(abs_pos * screenSize);
  vec2 texSize = vec2(textureSize(tex, 0));
  vec2 stripe = mod(floor(xy/32.0), 2.0)*2.0 - 1.0;
  fragColor = vec4(vec3(stripe.x * stripe.y * 0.02 + 0.02), 1);
  if (xy.x < texSize.x && xy.y < texSize.y) {
    vec4 pixel = texture(tex, xy/texSize);
    fragColor.rgb = mix(fragColor.rgb, pixel.rgb, pixel.a);
  }
}
