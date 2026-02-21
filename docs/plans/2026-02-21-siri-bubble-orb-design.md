# SiriBubble Orb Component Design

**Date:** 2026-02-21
**Status:** Approved
**Component:** `views/components/SiriBubble/`

## Overview

An amorphous, slowly morphing 3D orb component that provides real-time visual feedback during pitch sessions. Inspired by Apple's Siri orb aesthetic — transparent, glowing, and color-reactive.

## Technical Approach

**React Three Fiber + Custom GLSL Shaders**

- Three.js sphere geometry with custom vertex shader (simplex noise displacement)
- Custom fragment shader for gradient colors, transparency, and Fresnel edge glow
- React Three Fiber wraps Three.js in a React-native props API
- GPU-accelerated animation via shader uniforms

## Component API

```typescript
interface SiriBubbleProps {
  state: 'idle' | 'active' | 'positive' | 'negative' | 'neutral';
  intensity?: number;    // 0-1, default 0.5
  size?: 'sm' | 'md' | 'lg' | 'xl' | number; // default 'md'
  fluid?: boolean;       // default false
  opacity?: number;      // default 0.85
  className?: string;
}
```

**Size Presets:** sm=64px, md=128px, lg=256px, xl=512px

## Color Mapping

| State      | Primary     | Secondary   | Behavior                         |
|------------|-------------|-------------|----------------------------------|
| `idle`     | `#6B21A8`   | `#2563EB`   | Slow, gentle undulation          |
| `active`   | `#06B6D4`   | `#3B82F6`   | Medium movement, slightly faster |
| `positive` | `#22C55E`   | `#10B981`   | Energetic, expanding pulses      |
| `negative` | `#EF4444`   | `#F97316`   | Tighter, contracted movement     |
| `neutral`  | `#EAB308`   | `#F59E0B`   | Steady, balanced motion          |

Colors transition smoothly (~800ms lerp) on state change.

## Animation

- **Vertex displacement:** 3D simplex noise displaces sphere vertices along normals
- **Intensity scaling:** `intensity` prop scales displacement amplitude and animation speed
- **Breathing:** Subtle sin-wave scale oscillation (~2% amplitude, ~3s period)

## File Structure

```
views/components/SiriBubble/
├── index.ts              # Re-export
├── SiriBubble.tsx        # Main component (R3F Canvas + scene)
├── Orb.tsx               # Inner Three.js mesh component
├── shaders/
│   ├── vertex.glsl       # Vertex shader (noise displacement)
│   └── fragment.glsl     # Fragment shader (color, transparency, glow)
├── constants.ts          # Color maps, size presets, animation defaults
├── types.ts              # TypeScript interfaces
└── useSiriBubble.ts      # Hook for external state management
```

## Dependencies

```
three, @react-three/fiber, @react-three/drei, @types/three
tailwindcss, @tailwindcss/postcss, postcss
```

GLSL files loaded as raw strings via webpack `raw-loader` config in `next.config.ts`.

## Error Handling

- WebGL unavailable: CSS gradient circle fallback
- Low performance: Reduced sphere vertex count via `detail` prop

## Verification

Demo page at `app/(app)/demo/page.tsx` with all states, intensity slider, and size controls.
