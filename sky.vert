in vec2 points;

out vec2 pos;

void main() {
  gl_Position = vec4(points, 0.0, 1.0);
  pos = points;
}
