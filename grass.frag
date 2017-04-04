uniform vec3 light;

flat in vec4 grassRand2;
in vec3 position;
in float grassHeight;
in vec3 uNormal;

out vec4 fragColor;

#include "util.glsl"

void main() {
  vec3 darkness = vec3(mix(-0.2, 0.0, grassHeight));
  vec3 shade = 0.03*grassRand2.a*vec3(0.8, 1, 0.5);
  vec3 baseGrass = vec3(0.3, 0.5, 0.2);

  // direction
  vec3 toLight = normalize(light - position);
  vec3 normal = normalize(uNormal);
  vec3 toView = -normalize(position);
  vec3 halfVec = normalize(toLight + toView);

  // angle
  float dotNL = max(dot(normal, toLight), 0.0);
  float dotNH = max(dot(normal, halfVec), 0.0);

  fragColor = vec4((max(dotNL, 0.7) + 0.3*pow(dotNH, 5.0)) * (baseGrass + shade + darkness), 1.0);
}
