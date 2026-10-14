export const NOISE = /* glsl */ `
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float hash13(vec3 p3){ p3 = fract(p3 * .1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
vec3 hash33(vec3 p3){ p3 = fract(p3 * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yxz + 33.33); return fract((p3.xxy + p3.yxx) * p3.zyx); }
float vnoise(vec3 p){
  vec3 i = floor(p); vec3 f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(hash13(i), hash13(i+vec3(1,0,0)), f.x), mix(hash13(i+vec3(0,1,0)), hash13(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(hash13(i+vec3(0,0,1)), hash13(i+vec3(1,0,1)), f.x), mix(hash13(i+vec3(0,1,1)), hash13(i+vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++){ s += a * vnoise(p); p *= 2.03; a *= .5; } return s; }
`

/** Black body-ish ramp: t 0 = dark red, 1 = white hot */
export const HEAT = /* glsl */ `
vec3 heatRamp(float t){
  t = clamp(t, 0., 1.);
  vec3 a = vec3(0.35, 0.03, 0.0);
  vec3 b = vec3(1.0, 0.36, 0.05);
  vec3 c = vec3(1.0, 0.78, 0.45);
  vec3 d = vec3(1.0, 0.97, 0.9);
  return t < .4 ? mix(a, b, t / .4) : t < .75 ? mix(b, c, (t - .4) / .35) : mix(c, d, (t - .75) / .25);
}
`
