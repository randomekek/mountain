uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

in vec3 point;
in vec3 color;

flat out vec3 vertColor;

void main() {
  gl_Position = projection * view * model * vec4(point, 1.0);
  gl_PointSize = 11.0;
  vertColor = color + vec3(0.4);
}
