  float pi2 = util::PI*0.5;
  float s = sin(2.0*util::PI/3.1);
  float c = cos(2.0*util::PI/3.1);
  mat2 r = mat2(c, -s, s, c);
  float t = 100.0*time;
  float h = 0.0;
  h += 1.00*sharp(0.25*pos, 0.4*t);
  h += 1.00*sharp(0.25*pos+pi2, -0.4*t);
  h += 0.25*sharp(1.0*pos, 0.8*t);
  h += 0.25*sharp(1.0*pos+pi2, -0.8*t);
  h += 0.061*soft(4.0*pos, 1.6*t);
  h += 0.061*soft(4.0*pos+pi2, -1.6*t);
  h += 0.015*soft(16.0*pos, 3.2*t);
  h += 0.015*soft(16.0*pos+pi2, -3.2*t);

  h += 0.25*wave(pos, 0.8*t);
  h += 0.25*wave(r*pos, 0.8*t);
  h += 0.25*wave(r*r*pos, 0.8*t);
