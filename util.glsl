const float util::PI = 3.1415926535897932384626433832795;

float util::pow2(float x) {
  return x*x;
}

float util::rand1(float x) {
  return fract(sin(x * 12.9898 + 1.0) * 43758.5453);
}

float util::rand2(float x) {
  return fract(sin(x * 78.233 + 1.0) * 43758.5453);
}
