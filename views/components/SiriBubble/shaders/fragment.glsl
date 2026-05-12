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

void main() {
  vec3 N = normalize(vNormal);
  vec3 viewDir = normalize(-vPosition);
  float NdotV = max(dot(N, viewDir), 0.0);

  // Fresnel: 0 facing camera, 1 at grazing edges
  float fresnel = pow(1.0 - NdotV, uFresnelPower);

  // Smooth, slow color flow across surface (no splotchy noise)
  float flow = sin(vWorldNormal.x * 2.0 + vWorldNormal.y * 1.5 + uTime * 0.2) * 0.5 + 0.5;
  vec3 baseColor = mix(uColorPrimary, uColorSecondary, flow);

  // The color IS the edge — vivid, saturated, no grey mixing
  // At the rim: pure saturated color. In the center: nothing (transparent).
  vec3 rimColor = baseColor * 1.3; // boost beyond 1.0 for HDR-like pop

  // Subtle warm specular highlight
  vec3 lightDir = normalize(vec3(0.4, 0.7, 0.6));
  vec3 halfVec = normalize(lightDir + viewDir);
  float spec = pow(max(dot(N, halfVec), 0.0), 48.0);

  // Final color: just the rim color + specular, no white fill
  vec3 finalColor = rimColor + vec3(1.0, 0.95, 0.9) * spec * 0.5;

  // Alpha: the ENTIRE bubble effect is driven by Fresnel
  // Center = fully transparent, edges = colored and opaque
  float alpha = fresnel * uOpacity;

  // Soften the very inner area slightly so it's not a hard cutoff
  alpha = smoothstep(0.0, 0.15, alpha) * alpha;

  // Tiny bit of extra alpha where surface is displaced (subtle liquid depth)
  alpha += abs(vDisplacement) * 0.08;
  alpha = clamp(alpha, 0.0, uOpacity);

  gl_FragColor = vec4(finalColor, alpha);
}
