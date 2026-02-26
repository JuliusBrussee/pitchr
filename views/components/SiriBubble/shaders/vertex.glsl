// Simplex 3D noise — adapted from Ashima Arts (MIT license)
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
  + i.y + vec4(0.0, i1.y, i2.y, 1.0))
  + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

uniform float uTime;
uniform float uSpeed;
uniform float uDisplacement;
uniform float uIntensity;
uniform float uFresnelPower;
uniform float uFilmThickness;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldNormal;
varying float vDisplacement;
varying float vNoise;

void main() {
  // Smooth organic noise — gentler for bubble-like surface
  float t = uTime * uSpeed;
  float noise = snoise(position * 1.2 + t * 0.8);
  float noise2 = snoise(position * 2.5 + t * 0.4) * 0.4;
  float noise3 = snoise(position * 0.6 + t * 0.2) * 0.6; // large-scale gentle warping
  float totalNoise = (noise + noise2 + noise3) * uDisplacement * uIntensity;

  vec3 newPosition = position + normal * totalNoise;

  // Compute perturbed normal for accurate Fresnel
  float eps = 0.01;
  vec3 tangent1 = normalize(cross(normal, vec3(0.0, 1.0, 0.0)));
  if (length(cross(normal, vec3(0.0, 1.0, 0.0))) < 0.01) {
    tangent1 = normalize(cross(normal, vec3(1.0, 0.0, 0.0)));
  }
  vec3 tangent2 = normalize(cross(normal, tangent1));

  float n1 = snoise((position + tangent1 * eps) * 1.2 + t * 0.8)
           + snoise((position + tangent1 * eps) * 2.5 + t * 0.4) * 0.4
           + snoise((position + tangent1 * eps) * 0.6 + t * 0.2) * 0.6;
  float n2 = snoise((position + tangent2 * eps) * 1.2 + t * 0.8)
           + snoise((position + tangent2 * eps) * 2.5 + t * 0.4) * 0.4
           + snoise((position + tangent2 * eps) * 0.6 + t * 0.2) * 0.6;

  vec3 perturbedNormal = normalize(normal +
    (n1 - (noise + noise2 * 0.4 + noise3 * 0.6)) / eps * tangent1 * uDisplacement * uIntensity +
    (n2 - (noise + noise2 * 0.4 + noise3 * 0.6)) / eps * tangent2 * uDisplacement * uIntensity
  );

  vNormal = normalize(normalMatrix * perturbedNormal);
  vWorldNormal = normalize((modelMatrix * vec4(perturbedNormal, 0.0)).xyz);
  vPosition = (modelViewMatrix * vec4(newPosition, 1.0)).xyz;
  vDisplacement = totalNoise;
  vNoise = noise * 0.5 + 0.5;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
