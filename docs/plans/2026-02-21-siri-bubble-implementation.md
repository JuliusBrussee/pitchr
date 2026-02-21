# SiriBubble Orb Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a reusable, amorphous 3D orb component with pitch-feedback color states, smooth transitions, transparency, and scalable sizing.

**Architecture:** React Three Fiber Canvas wrapping a custom ShaderMaterial on an IcosahedronGeometry. Vertex shader uses simplex noise for organic displacement; fragment shader handles dual-color gradients, Fresnel glow, and transparency. State transitions lerp shader uniforms per-frame.

**Tech Stack:** Next.js 15, TypeScript, React Three Fiber, Three.js, Tailwind CSS v4, yarn

---

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `app/globals.css`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`

**Step 1: Initialize Next.js with TypeScript**

Run:
```bash
cd /Users/julb/Desktop/GitHub/pitchr
yarn init -y
yarn add next@latest react@latest react-dom@latest
yarn add -D typescript @types/react @types/react-dom @types/node
```

**Step 2: Add Tailwind CSS v4**

Run:
```bash
yarn add -D tailwindcss @tailwindcss/postcss postcss
```

**Step 3: Create postcss.config.mjs**

```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
```

**Step 4: Create app/globals.css**

```css
@import "tailwindcss";
```

**Step 5: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

**Step 6: Create next.config.ts**

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      '*.glsl': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
    },
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.glsl$/,
      type: 'asset/source',
    });
    return config;
  },
};

export default nextConfig;
```

**Step 7: Create app/layout.tsx**

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pitchr',
  description: 'AI-powered pitch battle platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen">{children}</body>
    </html>
  );
}
```

**Step 8: Create app/page.tsx (placeholder)**

```tsx
export default function Home() {
  return (
    <main className="flex items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold">Pitchr</h1>
    </main>
  );
}
```

**Step 9: Add scripts to package.json**

Ensure `package.json` scripts section has:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

**Step 10: Verify the dev server starts**

Run:
```bash
yarn dev
```
Expected: Server starts at localhost:3000 with "Pitchr" heading visible.

**Step 11: Commit**

```bash
git add package.json yarn.lock tsconfig.json next.config.ts postcss.config.mjs app/globals.css app/layout.tsx app/page.tsx
git commit -m "feat: initialize Next.js project with TypeScript and Tailwind CSS v4"
```

---

### Task 2: Install Three.js / React Three Fiber Dependencies

**Step 1: Install packages**

Run:
```bash
yarn add three @react-three/fiber @react-three/drei
yarn add -D @types/three raw-loader
```

**Step 2: Create GLSL type declaration**

Create `types/glsl.d.ts`:
```typescript
declare module '*.glsl' {
  const value: string;
  export default value;
}
```

**Step 3: Verify imports resolve**

Run:
```bash
npx tsc --noEmit
```
Expected: No type errors.

**Step 4: Commit**

```bash
git add package.json yarn.lock types/glsl.d.ts
git commit -m "feat: add Three.js and React Three Fiber dependencies"
```

---

### Task 3: Create Types and Constants

**Files:**
- Create: `views/components/SiriBubble/types.ts`
- Create: `views/components/SiriBubble/constants.ts`

**Step 1: Create types.ts**

```typescript
export type OrbState = 'idle' | 'active' | 'positive' | 'negative' | 'neutral';

export interface SiriBubbleProps {
  state: OrbState;
  intensity?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  fluid?: boolean;
  opacity?: number;
  className?: string;
}

export interface OrbColors {
  primary: string;
  secondary: string;
}

export interface OrbAnimationConfig {
  speed: number;
  displacement: number;
}
```

**Step 2: Create constants.ts**

```typescript
import { OrbState, OrbColors, OrbAnimationConfig } from './types';

export const SIZE_MAP: Record<string, number> = {
  sm: 64,
  md: 128,
  lg: 256,
  xl: 512,
};

export const COLOR_MAP: Record<OrbState, OrbColors> = {
  idle:     { primary: '#6B21A8', secondary: '#2563EB' },
  active:   { primary: '#06B6D4', secondary: '#3B82F6' },
  positive: { primary: '#22C55E', secondary: '#10B981' },
  negative: { primary: '#EF4444', secondary: '#F97316' },
  neutral:  { primary: '#EAB308', secondary: '#F59E0B' },
};

export const ANIMATION_MAP: Record<OrbState, OrbAnimationConfig> = {
  idle:     { speed: 0.3,  displacement: 0.15 },
  active:   { speed: 0.5,  displacement: 0.25 },
  positive: { speed: 0.7,  displacement: 0.35 },
  negative: { speed: 0.6,  displacement: 0.20 },
  neutral:  { speed: 0.4,  displacement: 0.20 },
};

export const DEFAULTS = {
  intensity: 0.5,
  size: 'md' as const,
  opacity: 0.85,
  lerpSpeed: 0.03,       // ~800ms smooth transition at 60fps
  breatheAmplitude: 0.02, // 2% scale oscillation
  breathePeriod: 3.0,     // 3 second breathing cycle
  sphereDetail: 64,       // icosahedron subdivision detail
};
```

**Step 3: Commit**

```bash
git add views/components/SiriBubble/types.ts views/components/SiriBubble/constants.ts
git commit -m "feat: add SiriBubble types and constants"
```

---

### Task 4: Write the Vertex Shader

**Files:**
- Create: `views/components/SiriBubble/shaders/vertex.glsl`

**Step 1: Write vertex.glsl with simplex noise displacement**

The vertex shader needs:
1. A 3D simplex noise function (self-contained, no external deps)
2. Time uniform for continuous animation
3. Displacement and speed uniforms controlled by props
4. Noise applied along vertex normals for organic blob deformation

```glsl
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

varying vec3 vNormal;
varying vec3 vPosition;
varying float vDisplacement;

void main() {
  vNormal = normalize(normalMatrix * normal);

  float t = uTime * uSpeed;
  float noise = snoise(position * 1.5 + t);
  float noise2 = snoise(position * 3.0 + t * 0.5) * 0.5;
  float totalNoise = (noise + noise2) * uDisplacement * uIntensity;

  vec3 newPosition = position + normal * totalNoise;
  vPosition = newPosition;
  vDisplacement = totalNoise;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
```

**Step 2: Commit**

```bash
git add views/components/SiriBubble/shaders/vertex.glsl
git commit -m "feat: add vertex shader with simplex noise displacement"
```

---

### Task 5: Write the Fragment Shader

**Files:**
- Create: `views/components/SiriBubble/shaders/fragment.glsl`

**Step 1: Write fragment.glsl with dual-color gradient, Fresnel glow, and transparency**

```glsl
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
```

**Step 2: Commit**

```bash
git add views/components/SiriBubble/shaders/fragment.glsl
git commit -m "feat: add fragment shader with Fresnel glow and color blending"
```

---

### Task 6: Build the Orb Mesh Component

**Files:**
- Create: `views/components/SiriBubble/Orb.tsx`

**Step 1: Write Orb.tsx — the inner Three.js mesh with ShaderMaterial**

```tsx
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
}

export function Orb({ state, intensity, opacity }: OrbProps) {
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
  });

  // Update targets when props change
  targets.current.colorPrimary.set(COLOR_MAP[state].primary);
  targets.current.colorSecondary.set(COLOR_MAP[state].secondary);
  targets.current.speed = ANIMATION_MAP[state].speed;
  targets.current.displacement = ANIMATION_MAP[state].displacement;
  targets.current.intensity = intensity;
  targets.current.opacity = opacity;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeed: { value: ANIMATION_MAP[state].speed },
      uDisplacement: { value: ANIMATION_MAP[state].displacement },
      uIntensity: { value: intensity },
      uColorPrimary: { value: new THREE.Color(COLOR_MAP[state].primary) },
      uColorSecondary: { value: new THREE.Color(COLOR_MAP[state].secondary) },
      uOpacity: { value: opacity },
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
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add views/components/SiriBubble/Orb.tsx
git commit -m "feat: add Orb mesh component with animated ShaderMaterial"
```

---

### Task 7: Build the Main SiriBubble Component

**Files:**
- Create: `views/components/SiriBubble/SiriBubble.tsx`
- Create: `views/components/SiriBubble/index.ts`

**Step 1: Write SiriBubble.tsx — the public component wrapping Canvas**

```tsx
'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Orb } from './Orb';
import { SiriBubbleProps } from './types';
import { SIZE_MAP, DEFAULTS } from './constants';

function resolveSize(
  size: SiriBubbleProps['size'],
  fluid: boolean
): { width: string; height: string } {
  if (fluid) return { width: '100%', height: '100%' };
  const px = typeof size === 'number' ? size : SIZE_MAP[size ?? 'md'];
  return { width: `${px}px`, height: `${px}px` };
}

function CSSFallback({ size, fluid }: { size: SiriBubbleProps['size']; fluid: boolean }) {
  const { width, height } = resolveSize(size, fluid);
  return (
    <div
      style={{ width, height }}
      className="rounded-full bg-gradient-to-br from-purple-600 to-blue-500 opacity-80 blur-sm animate-pulse"
    />
  );
}

export function SiriBubble({
  state,
  intensity = DEFAULTS.intensity,
  size = DEFAULTS.size,
  fluid = false,
  opacity = DEFAULTS.opacity,
  className,
}: SiriBubbleProps) {
  const { width, height } = resolveSize(size, fluid);

  return (
    <div className={className} style={{ width, height }}>
      <Suspense fallback={<CSSFallback size={size} fluid={fluid} />}>
        <Canvas
          gl={{ alpha: true, premultipliedAlpha: false, antialias: true }}
          camera={{ position: [0, 0, 3], fov: 45 }}
          style={{ background: 'transparent' }}
          dpr={[1, 2]}
        >
          <Orb state={state} intensity={intensity} opacity={opacity} />
        </Canvas>
      </Suspense>
    </div>
  );
}
```

**Step 2: Write index.ts barrel export**

```typescript
export { SiriBubble } from './SiriBubble';
export type { SiriBubbleProps, OrbState } from './types';
```

**Step 3: Commit**

```bash
git add views/components/SiriBubble/SiriBubble.tsx views/components/SiriBubble/index.ts
git commit -m "feat: add SiriBubble wrapper component with Canvas and fallback"
```

---

### Task 8: Create the useSiriBubble Hook

**Files:**
- Create: `views/components/SiriBubble/useSiriBubble.ts`

**Step 1: Write the hook for external state management**

```typescript
'use client';

import { useState, useCallback, useMemo } from 'react';
import { OrbState, SiriBubbleProps } from './types';
import { DEFAULTS } from './constants';

interface UseSiriBubbleReturn {
  props: Pick<SiriBubbleProps, 'state' | 'intensity'>;
  setState: (state: OrbState) => void;
  setIntensity: (intensity: number) => void;
}

export function useSiriBubble(
  initialState: OrbState = 'idle',
  initialIntensity: number = DEFAULTS.intensity
): UseSiriBubbleReturn {
  const [state, setState] = useState<OrbState>(initialState);
  const [intensity, setIntensityRaw] = useState(initialIntensity);

  const setIntensity = useCallback((v: number) => {
    setIntensityRaw(Math.max(0, Math.min(1, v)));
  }, []);

  const props = useMemo(() => ({ state, intensity }), [state, intensity]);

  return { props, setState, setIntensity };
}
```

**Step 2: Add hook to barrel export**

Update `views/components/SiriBubble/index.ts`:
```typescript
export { SiriBubble } from './SiriBubble';
export { useSiriBubble } from './useSiriBubble';
export type { SiriBubbleProps, OrbState } from './types';
```

**Step 3: Commit**

```bash
git add views/components/SiriBubble/useSiriBubble.ts views/components/SiriBubble/index.ts
git commit -m "feat: add useSiriBubble hook for external state management"
```

---

### Task 9: Build the Demo Page

**Files:**
- Create: `app/(app)/demo/page.tsx`

**Step 1: Write the demo page with interactive controls**

```tsx
'use client';

import { SiriBubble, useSiriBubble, OrbState } from '@/views/components/SiriBubble';

const STATES: OrbState[] = ['idle', 'active', 'positive', 'negative', 'neutral'];
const SIZES = ['sm', 'md', 'lg', 'xl'] as const;

export default function DemoPage() {
  const { props, setState, setIntensity } = useSiriBubble();

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-3xl font-bold text-white">SiriBubble Demo</h1>

      {/* Main orb */}
      <SiriBubble {...props} size="xl" />

      {/* State controls */}
      <div className="flex gap-3">
        {STATES.map((s) => (
          <button
            key={s}
            onClick={() => setState(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              props.state === s
                ? 'bg-white text-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Intensity slider */}
      <div className="flex items-center gap-4 text-white">
        <span className="text-sm">Intensity</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={props.intensity}
          onChange={(e) => setIntensity(parseFloat(e.target.value))}
          className="w-48"
        />
        <span className="text-sm w-10">{props.intensity?.toFixed(2)}</span>
      </div>

      {/* Size comparison row */}
      <div className="flex items-end gap-6 mt-8">
        {SIZES.map((s) => (
          <div key={s} className="flex flex-col items-center gap-2">
            <SiriBubble {...props} size={s} />
            <span className="text-xs text-white/60">{s}</span>
          </div>
        ))}
      </div>

      {/* Fluid container demo */}
      <div className="mt-8 w-64 h-64 border border-white/20 rounded-lg">
        <SiriBubble {...props} fluid />
      </div>
      <span className="text-xs text-white/60">fluid (fills 256x256 container)</span>
    </div>
  );
}
```

**Step 2: Run the dev server and visually verify**

Run: `yarn dev`
Navigate to: `http://localhost:3000/demo`

Expected:
- Large orb renders with amorphous morphing animation
- State buttons change orb color with smooth transitions
- Intensity slider controls animation amplitude
- Size comparison shows all 4 preset sizes
- Fluid container fills its parent

**Step 3: Commit**

```bash
git add app/\(app\)/demo/page.tsx
git commit -m "feat: add SiriBubble interactive demo page"
```

---

### Task 10: Visual Polish and Final Verification

**Step 1: Run the full build to check for errors**

Run:
```bash
yarn build
```
Expected: Build completes with no errors.

**Step 2: Test all states visually on the demo page**

Run: `yarn dev` and navigate to `/demo`.

Verify each state:
- `idle`: Purple/blue, slow gentle movement
- `active`: Cyan/blue, medium speed
- `positive`: Green, energetic expanding pulses
- `negative`: Red/orange, tighter contracted motion
- `neutral`: Yellow/amber, steady balanced

Verify transitions are smooth (~800ms) between states.
Verify intensity slider scales animation from near-still (0) to dramatic (1).
Verify all sizes render correctly (sm through xl + fluid).
Verify transparency — orb should be see-through with background visible.

**Step 3: Final commit if any polish was needed**

```bash
git add -A
git commit -m "polish: refine SiriBubble visual quality and transitions"
```

---

## Summary

| Task | What | Estimated Effort |
|------|------|-----------------|
| 1 | Next.js + Tailwind project setup | Setup |
| 2 | Three.js / R3F dependencies | Setup |
| 3 | Types and constants | Small |
| 4 | Vertex shader (simplex noise) | Medium |
| 5 | Fragment shader (colors/glow) | Medium |
| 6 | Orb mesh component | Medium |
| 7 | SiriBubble wrapper + Canvas | Medium |
| 8 | useSiriBubble hook | Small |
| 9 | Demo page with controls | Medium |
| 10 | Build verification + polish | Small |
