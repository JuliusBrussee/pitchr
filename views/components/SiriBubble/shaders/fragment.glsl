uniform vec3 uColorPrimary;
uniform vec3 uColorSecondary;
uniform float uOpacity;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vPosition;
varying float vDisplacement;

void main() {
  // Fresnel effect — edges glow brighter
  vec3 viewDirection = normalize(cameraPosition - vPosition);
  float fresnel = 1.0 - dot(viewDirection, vNormal);
  fresnel = pow(fresnel, 2.5);

  // Blend primary and secondary colors based on displacement + position
  float mixFactor = vDisplacement * 2.0 + 0.5;
  mixFactor += sin(vPosition.y * 3.0 + uTime * 0.5) * 0.2;
  mixFactor = clamp(mixFactor, 0.0, 1.0);

  vec3 baseColor = mix(uColorPrimary, uColorSecondary, mixFactor);

  // Add a bright inner glow
  vec3 glowColor = mix(baseColor, vec3(1.0), fresnel * 0.6);

  // Combine: core color + edge glow
  vec3 finalColor = mix(baseColor, glowColor, fresnel);

  // Alpha: more transparent at edges (Fresnel), base opacity from prop
  float alpha = uOpacity * (1.0 - fresnel * 0.4);

  gl_FragColor = vec4(finalColor, alpha);
}
