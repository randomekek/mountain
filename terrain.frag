uniform vec3 light;
const float PI = 3.1415926535897932384626433832795;
float pow2(float x) { return x*x; }
uniform mat4 view;

in vec3 uNormal;
in vec3 position;
in float water;

out vec4 fragColor;

void main() {
  // direction
  vec3 toLight = normalize(light - position);
  vec3 toView = -normalize(position);
  vec3 normal = normalize(uNormal);
  vec3 halfVec = normalize(toLight + toView);

  // angle
  float dotLH = max(dot(halfVec, toLight), 0.0);
  float dotNL = max(dot(normal, toLight), 0.0);
  float dotNV = abs(dot(normal, toView)) + 1e-6;
  float dotNH = max(dot(normal, halfVec), 0.0);

  // phong: diffuse = dotNL; specular = pow(dotNH, 11.0);
  if (water > 0.5) {
    vec3 water = vec3(0.3, 0.4, 0.8);
    fragColor = vec4(max(dotNL + fract(position * mat3(view)), 0.6)*vec3(water), 1.0);
  } else {
    vec3 darkness = vec3(-0.2);
    vec3 baseGrass = vec3(0.3, 0.5, 0.2);
    fragColor = vec4((max(dotNL, 0.7) + 0.3*pow(dotNH, 5.0))*vec3(baseGrass + darkness), 1.0);
  }
}
