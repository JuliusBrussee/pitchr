uniform vec3 uColorPrimary;
uniform vec3 uColorSecondary;
uniform float uOpacity;
uniform float uTime;
uniform float uFresnelPower;
uniform float uFilmThickness;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldNormal;
varying float vDisplacement;
varying float vNoise;

// Attempt thin-film iridescence via simple wavelength model
vec3 thinFilmColor(float cosTheta, float thickness) {
  float delta = 2.0 * thickness * cosTheta;
  // Approximate interference for RGB wavelengths
  vec3 rgb;
  rgb.r = 0.5 + 0.5 * cos(delta * 12.0 + 0.0);
  rgb.g = 0.5 + 0.5 * cos(delta * 12.0 + 2.094); // +2π/3
  rgb.b = 0.5 + 0.5 * cos(delta * 12.0 + 4.189); // +4π/3
  return rgb;
}

void main() {
  vec3 viewDir = normalize(-vPosition); // eye-space view direction
  float NdotV = max(dot(normalize(vNormal), viewDir), 0.0);

  // Fresnel: 0 at center (facing camera), 1 at grazing edges
  float fresnel = pow(1.0 - NdotV, uFresnelPower);

  // Thin-film iridescence — subtle rainbow shimmer
  float filmOffset = vNoise * 0.4 + uTime * 0.05;
  vec3 iridescence = thinFilmColor(NdotV, uFilmThickness + filmOffset);

  // Swirling color bands across surface
  float swirl1 = sin(vWorldNormal.x * 3.0 + vWorldNormal.y * 2.0 + uTime * 0.15) * 0.5 + 0.5;
  float swirl2 = sin(vWorldNormal.z * 2.5 - uTime * 0.12 + vDisplacement * 5.0) * 0.5 + 0.5;
  float mixFactor = swirl1 * 0.5 + swirl2 * 0.3 + vNoise * 0.2;

  vec3 baseColor = mix(uColorPrimary, uColorSecondary, mixFactor);

  // Blend base color with iridescence (subtle)
  vec3 filmColor = mix(baseColor, iridescence * baseColor * 1.5, 0.2 + fresnel * 0.3);

  // Edge glow — color is strong at rim, nearly white/transparent in center
  vec3 edgeColor = filmColor * (0.8 + fresnel * 0.5);
  vec3 centerColor = vec3(1.0); // white/clear center

  // Mix: transparent white center → colored edge
  vec3 surfaceColor = mix(centerColor, edgeColor, pow(fresnel, 0.6));

  // Specular highlights — two fake light sources for glass look
  vec3 lightDir1 = normalize(vec3(0.5, 0.8, 0.6));
  vec3 lightDir2 = normalize(vec3(-0.6, 0.4, 0.8));
  vec3 halfVec1 = normalize(lightDir1 + viewDir);
  vec3 halfVec2 = normalize(lightDir2 + viewDir);
  float spec1 = pow(max(dot(normalize(vNormal), halfVec1), 0.0), 64.0);
  float spec2 = pow(max(dot(normalize(vNormal), halfVec2), 0.0), 96.0);
  vec3 specular = vec3(1.0) * (spec1 * 0.4 + spec2 * 0.25);

  vec3 finalColor = surfaceColor + specular;

  // Alpha: near-transparent center, more opaque at edges (soap film)
  // The key to the bubble look — center is almost see-through
  float edgeAlpha = smoothstep(0.0, 1.0, fresnel);
  float alpha = mix(0.02, uOpacity, edgeAlpha);

  // Add slight opacity for displacement areas (flowing liquid feel)
  alpha += abs(vDisplacement) * 0.15;
  alpha = clamp(alpha, 0.0, uOpacity);

  gl_FragColor = vec4(finalColor, alpha);
}
