uniform vec3 light;
const float PI = 3.1415926535897932384626433832795;
float pow2(float x) { return x*x; }

flat in int vid;
in vec3 position;

out vec4 fragColor;

void main() {
  fragColor = vec4(fract(float(vid) * 97./463.), 0.3, 0.8, 1.0);
}
