uniform vec3 light;

flat in int vid;
flat in float grassId;
in vec3 position;
in float grassHeight;

const float PI = 3.1415926535897932384626433832795;
float pow2(float x) { return x*x; }
float rand1(float x) { return fract(sin(x * 12.9898 + 1.0) * 43758.5453); }
float rand2(float x) { return fract(sin(x * 78.233 + 1.0) * 43758.5453); }

out vec4 fragColor;

void main() {
  fragColor = vec4(fract(float(vid) * 97./463.), 0.3, 0.8, 1.0);
  fragColor = vec4(0.3, 0.5, 0.2, 1.0) + 0.2*rand2(grassId*0.05 + 0.3)*vec4(0.8, 1, 0.5, 0) + vec4(vec3(mix(-0.2, 0.0, grassHeight)), 1.0);
}
