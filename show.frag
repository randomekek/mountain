uniform sampler2D tex;
uniform vec2 size;

in vec2 pos;

out vec4 fragColor;

void main() {
  vec2 abs_pos = 0.5 + 0.5 * pos;
  vec2 xy = vec2(abs_pos * size);
  vec2 size = vec2(textureSize(tex, 0));
  if (xy.x > size.x || xy.y > size.y) {
    fragColor = vec4(0.4*sin(xy/20.0), 0, 1);
  } else {
    fragColor = texture(tex, xy/size);
  }
}
