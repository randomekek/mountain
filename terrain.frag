uniform vec3 light;
uniform vec3 light_world;
uniform mat4 view;
uniform mat4 model;
uniform float time;

in vec3 uNormal;
in vec3 position;
in float water;
in vec2 pos;
in vec2 waterPos[6];

out vec4 fragColor;

#include "water.glsl"

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
    vec3 water = vec3(0.5);//0.3, 0.4, 0.8);
    normal = normalize(mat3(view) * mat3(model) * water::normal(waterPos));
    float dotNL = max(dot(normal, toLight), 0.0);
    //fragColor = vec4(fract(position * mat3(view))*water, 1.0);
    fragColor = vec4(max(dotNL, 0.0)*(water), 1.0);
  } else {
    vec3 darkness = vec3(-0.2);
    vec3 baseGrass = vec3(0.3, 0.5, 0.2);
    fragColor = vec4((max(dotNL, 0.7) + 0.3*pow(dotNH, 5.0))*(baseGrass + darkness), 1.0);
  }
}
