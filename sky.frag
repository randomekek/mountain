uniform vec3 sun;
uniform mat4 view;
uniform mat4 projection;

in vec2 pos;

out vec4 fragColor;

void main() {
  vec3 V = transpose(mat3(view))*normalize(vec3(pos.x/projection[0][0], pos.y/projection[1][1], -1.0));
  vec3 sun = normalize(sun);

  // taken from iq's clouds
	float dotSunView = max(0.0, dot(sun, V));
  vec3 sky = vec3(0.6, 0.71, 0.75);
  vec3 groundTint = vec3(1.0, 0.5, 1.0);
	vec3 col = sky - V.y*0.2*groundTint + 0.15*0.5;
	col += 0.2*vec3(1.0,0.6,0.1)*pow(dotSunView, 15.0);
	col += 0.2*vec3(1.0,0.4,0.2)*pow(dotSunView, 3.0);

  fragColor = vec4(col, 1.0);
}
