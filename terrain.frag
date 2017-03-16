uniform vec3 light;
const float PI = 3.1415926535897932384626433832795;
float pow2(float x) { return x*x; }

flat in int vid;
in vec3 uNormal;
in vec3 position;

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

  // pbr
  // friendly description - https://disney-animation.s3.amazonaws.com/library/s2012_pbs_disney_brdf_notes_v2.pdf
  // lots of code - http://www.frostbite.com/wp-content/uploads/2014/11/course_notes_moving_frostbite_to_pbr_v2.pdf
  // lots of code - http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf
  // comparison - http://graphicrants.blogspot.com.au/2013/08/specular-brdf-reference.html
  vec3 color = vec3(fract(float(vid) * 97./463.), 0.8, 0.4);
  vec3 edgeTint = vec3(1.0);
  vec3 lightColor = vec3(1.0);
  float metalness = 0.0;
  float roughness = 1.0;

  vec3 diffuseColor = mix(color, vec3(0.018), metalness);  // diffuse color (dialetric = color, metal = 0-0.02)
  vec3 f0 = mix(vec3(0.04), color, metalness);  // (head on) specular color (diaelectric = 0-0.2, metal = color)
  vec3 f90 = mix(vec3(1.0), edgeTint, metalness); // glancing specular color (dialetric = 1, metal = edgeTint silver gold or white)

  float a2 = pow2(pow2(roughness));
  // d = chance microfacet faces the half vector. model: GGX(trowbridge-reitz)
  float d = a2 / pow2(1.0 + (a2 - 1.0) * pow2(dotNH)) / PI;
  // f = intrinsic reflectivity of microfacet. model: schlick
  vec3 f = f0 + (f90 - f0)*exp2((-5.55473*dotLH - 6.98316)*dotLH);
  // g = fraction of microfacets visible (due to self shadowing). model: ggx
  float ggxV = dotNL * sqrt(a2 + pow2(dotNV)*(1.0 - a2));
  float ggxL = dotNV * sqrt(a2 + pow2(dotNL)*(1.0 - a2));
  float g = 0.5 / max(ggxV + ggxL, 1e-6);
  vec3 specularColor = d * f * g;

  fragColor = vec4(lightColor*dotNL*(diffuseColor + specularColor), 1.0);
}
