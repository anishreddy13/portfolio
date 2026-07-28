"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ── Electric color palette ── */
const ELECTRIC_PALETTE = [
  new THREE.Color("#FF2D2D"), // electric red
  new THREE.Color("#FF6B35"), // hot coral
  new THREE.Color("#C8FF00"), // acid lime
  new THREE.Color("#A855F7"), // violet
  new THREE.Color("#FF2D2D"), // red again (weight it more)
  new THREE.Color("#ffffff"), // white spark
];

/* ── Particle field ── */
function ParticleField() {
  const meshRef = useRef<THREE.Points>(null);

  const { positions, colors, sizes } = useMemo(() => {
    const count = 750;
    const positions = new Float32Array(count * 3);
    const colors    = new Float32Array(count * 3);
    const sizes     = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      /* spread in a wide flat field */
      positions[i * 3]     = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;

      const c = ELECTRIC_PALETTE[Math.floor(Math.random() * ELECTRIC_PALETTE.length)];
      colors[i * 3]     = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      /* varied sizes — most tiny, some bigger sparks */
      sizes[i] = Math.random() < 0.08 ? 0.18 : 0.06 + Math.random() * 0.06;
    }

    return { positions, colors, sizes };
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    /* slow rotating drift with subtle pulse */
    meshRef.current.rotation.y = t * 0.012;
    meshRef.current.rotation.x = Math.sin(t * 0.007) * 0.06;
    /* gentle scale pulse on the whole field */
    const pulse = 1 + Math.sin(t * 0.5) * 0.015;
    meshRef.current.scale.setScalar(pulse);
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.55}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ── Glowing energy orb ── */
function EnergyOrb({
  position,
  color,
  scale,
  speed,
  phase = 0,
}: {
  position: [number, number, number];
  color: string;
  scale: number;
  speed: number;
  phase?: number;
}) {
  const meshRef  = useRef<THREE.Mesh>(null);
  const glowRef  = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.position.y =
        position[1] + Math.sin(t * speed + phase) * 1.2;
      meshRef.current.position.x =
        position[0] + Math.cos(t * speed * 0.7 + phase) * 0.6;
      meshRef.current.rotation.z = t * 0.08;
    }
    if (glowRef.current) {
      glowRef.current.position.y =
        position[1] + Math.sin(t * speed + phase) * 1.2;
      glowRef.current.position.x =
        position[0] + Math.cos(t * speed * 0.7 + phase) * 0.6;
      /* breathe the glow */
      const breath = 1 + Math.sin(t * speed * 2) * 0.12;
      glowRef.current.scale.setScalar(scale * 2.8 * breath);
    }
  });

  return (
    <>
      {/* Core orb */}
      <mesh ref={meshRef} position={position} scale={scale}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Outer glow halo */}
      <mesh ref={glowRef} position={position} scale={scale * 2.8}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.018}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

/* ── Scanning grid lines ── */
function GridLines() {
  const groupRef = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    /* horizontal lines */
    for (let y = -20; y <= 20; y += 4) {
      points.push(new THREE.Vector3(-50, y, -20));
      points.push(new THREE.Vector3(50,  y, -20));
    }
    /* vertical lines */
    for (let x = -50; x <= 50; x += 8) {
      points.push(new THREE.Vector3(x, -20, -20));
      points.push(new THREE.Vector3(x,  20, -20));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      /* very slow tilt — barely perceptible depth */
      groupRef.current.rotation.x =
        -0.3 + Math.sin(clock.getElapsedTime() * 0.05) * 0.04;
    }
  });

  return (
    <group ref={groupRef}>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial
          color="#FF2D2D"
          transparent
          opacity={0.04}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

/* ── Main export ── */
export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 32], fov: 58 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.3} />
        <ParticleField />
        <GridLines />

        {/* Red — dominant, top-left */}
        <EnergyOrb
          position={[-12, 6, -12]}
          color="#FF2D2D"
          scale={10}
          speed={0.18}
          phase={0}
        />
        {/* Coral — bottom-right */}
        <EnergyOrb
          position={[14, -6, -16]}
          color="#FF6B35"
          scale={12}
          speed={0.14}
          phase={1.2}
        />
        {/* Lime — top-right */}
        <EnergyOrb
          position={[10, 10, -20]}
          color="#C8FF00"
          scale={9}
          speed={0.22}
          phase={2.4}
        />
        {/* Violet — center-left */}
        <EnergyOrb
          position={[-8, -8, -18]}
          color="#A855F7"
          scale={8}
          speed={0.16}
          phase={3.6}
        />
      </Canvas>

      {/* Dark vignette — keeps edges deep black */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 85% 75% at 50% 50%, transparent 30%, rgba(var(--color-overlay-base), 0.7) 100%)",
        }}
      />

      {/* Top fade — navbar readability */}
      <div
        className="absolute inset-x-0 top-0 h-32"
        style={{
          background:
            "linear-gradient(to bottom, rgba(var(--color-overlay-base), 0.9) 0%, transparent 100%)",
        }}
      />

      {/* Bottom fade */}
      <div
        className="absolute inset-x-0 bottom-0 h-40"
        style={{
          background:
            "linear-gradient(to top, rgba(var(--color-overlay-base), 0.95) 0%, transparent 100%)",
        }}
      />

      {/* Subtle red scan line — very faint horizontal sweep */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,45,45,0.008) 3px, rgba(255,45,45,0.008) 4px)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}