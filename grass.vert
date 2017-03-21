uniform float heightScale;
uniform sampler2D heightMap;
uniform float spacingPerGrass;
uniform int grassInstanceSide;
uniform vec2 grassSize;
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

in vec2 grassVertex;

flat out int vid;
out vec3 position;

float height(vec2 pos) {
  return heightScale*texture(heightMap, pos*0.02).x;
}

vec3 vertex(int id, int instance) {
  vec2 pos = spacingPerGrass * vec2(float(instance / grassInstanceSide), float(instance % grassInstanceSide));
  float h = height(pos);
  vec3 grass = vec3(view[0][0], view[1][0], view[2][0]) * vec3(grassSize.x * grassVertex.x);
  float grassH = grassSize.y * grassVertex.y;
  return vec3(pos.x + grass.x, h + grassH, -pos.y + grass.z);
}

void main() {
  vec3 pos = vertex(gl_VertexID, gl_InstanceID);
  vec4 position4 = view * model * vec4(pos, 1.0);
  position = position4.xyz / position4.w;
  gl_Position = projection * position4;
  vid = gl_VertexID;
}
