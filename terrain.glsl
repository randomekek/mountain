float terrain::height(vec2 pos) {
  return heightScale*(texture(heightMap, pos*landScale).x - 0.5);
  //return heightScale*sin(pos.x)*sin(pos.y);
}

vec3 terrain::normal(vec2 pos) {
  float delta = 0.4;
  vec2 off = vec2(delta, 0.0);
  float x1 = terrain::height(pos - off);
  float x2 = terrain::height(pos + off);
  float y1 = terrain::height(pos - off.yx);
  float y2 = terrain::height(pos + off.yx);
  return vec3(x1 - x2, 2.0 * delta, y1 - y2);
}
