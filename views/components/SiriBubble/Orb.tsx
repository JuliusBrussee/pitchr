'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbState } from './types';
import { COLOR_MAP, ANIMATION_MAP, DEFAULTS } from './constants';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';

interface OrbProps {
  state: OrbState;
  intensity: number;
  opacity: number;
  fresnelPower?: number;
  filmThickness?: number;
}

export function Orb({
  state,
  intensity,
  opacity,
  fresnelPower = 2.5,
  filmThickness = 0.6,
}: OrbProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Target values (what we're lerping toward)
  const targets = useRef({
    colorPrimary: new THREE.Color(COLOR_MAP[state].primary),
    colorSecondary: new THREE.Color(COLOR_MAP[state].secondary),
    speed: ANIMATION_MAP[state].speed,
    displacement: ANIMATION_MAP[state].displacement,
    intensity,
    opacity,
    fresnelPower,
    filmThickness,
  });

  // Update targets when props change
  targets.current.colorPrimary.set(COLOR_MAP[state].primary);
  targets.current.colorSecondary.set(COLOR_MAP[state].secondary);
  targets.current.speed = ANIMATION_MAP[state].speed;
  targets.current.displacement = ANIMATION_MAP[state].displacement;
  targets.current.intensity = intensity;
  targets.current.opacity = opacity;
  targets.current.fresnelPower = fresnelPower;
  targets.current.filmThickness = filmThickness;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeed: { value: ANIMATION_MAP[state].speed },
      uDisplacement: { value: ANIMATION_MAP[state].displacement },
      uIntensity: { value: intensity },
      uColorPrimary: { value: new THREE.Color(COLOR_MAP[state].primary) },
      uColorSecondary: { value: new THREE.Color(COLOR_MAP[state].secondary) },
      uOpacity: { value: opacity },
      uFresnelPower: { value: fresnelPower },
      uFilmThickness: { value: filmThickness },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Intentionally empty — uniforms are mutated in useFrame
  );

  useFrame(({ clock }) => {
    if (!materialRef.current) return;

    const u = materialRef.current.uniforms;
    const t = targets.current;
    const lerp = DEFAULTS.lerpSpeed;

    // Animate time
    u.uTime.value = clock.elapsedTime;

    // Smooth lerp all uniforms toward targets
    u.uSpeed.value += (t.speed - u.uSpeed.value) * lerp;
    u.uDisplacement.value += (t.displacement - u.uDisplacement.value) * lerp;
    u.uIntensity.value += (t.intensity - u.uIntensity.value) * lerp;
    u.uOpacity.value += (t.opacity - u.uOpacity.value) * lerp;
    u.uFresnelPower.value += (t.fresnelPower - u.uFresnelPower.value) * lerp;
    u.uFilmThickness.value += (t.filmThickness - u.uFilmThickness.value) * lerp;
    u.uColorPrimary.value.lerp(t.colorPrimary, lerp);
    u.uColorSecondary.value.lerp(t.colorSecondary, lerp);

    // Breathing animation
    if (meshRef.current) {
      const breathe =
        1.0 +
        Math.sin(clock.elapsedTime * ((2 * Math.PI) / DEFAULTS.breathePeriod)) *
          DEFAULTS.breatheAmplitude;
      meshRef.current.scale.setScalar(breathe);
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, DEFAULTS.sphereDetail]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}
