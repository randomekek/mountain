uniform float heightScale;
uniform float landScale;
uniform sampler2D heightMap;
uniform float spacingPerGrass;
uniform float grassInstanceSide;
uniform vec2 grassSize;
uniform float grassRotate;
uniform float time;
uniform float waterLevel;
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

in vec2 grassVertex;
in vec2 grassGrid;
in vec4 grassRand;

out vec3 position;
out float grassHeight;
out vec3 uNormal;
flat out vec4 grassRand2;

#include "terrain.glsl"

void main() {
  vec2 vertex = grassSize * grassVertex;

  grassHeight = grassVertex.y/4.0;
  grassRand2 = grassRand;

  vec2 pos = spacingPerGrass * (grassGrid * vec2(1, -1) + grassRand.xy);
  float bendStrength = grassRotate * (0.3 + 0.2 * sin(2.3 * (time + 0.07 * grassGrid.y + 0.3 * grassRand.z)));
  float deg = (0.2 + grassHeight) * bendStrength * mix(0.7, 1.0, grassRand.w);
  float rot = mix(-0.3, 0.3, grassRand.z);
  vec3 up = vec3(sin(deg)*sin(rot), cos(deg), sin(deg)*cos(rot)) * mix(0.6, 1.0, grassRand.z);
  float h = terrain::height(pos);
  vec3 base = vec3(pos.x, h, pos.y) + vertex.y * up;

  if (h < waterLevel) {
    // cancel for water
    position = vec3(0);
    gl_Position = vec4(0, 0, 0, 1);
    return;
  }

  vec4 position4 = view * model * vec4(base, 1.0);
  vec3 perpendicular = mix(1.0, 0.4, grassHeight) * normalize(cross(mat3(view) * up, position4.xyz));
  position4.xyz = position4.xyz + vertex.x * perpendicular;

  uNormal = mat3(view) * terrain::normal(pos);
  position = position4.xyz / position4.w;
  gl_Position = projection * position4;
}
