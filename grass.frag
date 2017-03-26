uniform vec3 light;

flat in vec4 grassRand2;
in vec3 position;
in float grassHeight;
in vec3 uNormal;

const float PI = 3.1415926535897932384626433832795;
float pow2(float x) { return x*x; }
float rand1(float x) { return fract(sin(x * 12.9898 + 1.0) * 43758.5453); }
float rand2(float x) { return fract(sin(x * 78.233 + 1.0) * 43758.5453); }

out vec4 fragColor;

void main() {
  vec3 darkness = vec3(mix(-0.2, 0.0, grassHeight));
  vec3 shade = vec3(0); //0.15*grassRand2.a*vec3(0.8, 1, 0.5);
  vec3 baseGrass = vec3(0.3, 0.5, 0.2);

  // direction
  vec3 toLight = normalize(light - position);
  vec3 normal = normalize(uNormal);

  // angle
  float dotNL = max(dot(normal, toLight), 0.6);

  fragColor = vec4(dotNL*(baseGrass + shade + darkness), 1.0);
}
