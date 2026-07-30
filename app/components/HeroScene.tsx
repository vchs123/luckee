import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Float } from "@react-three/drei";
import { useRef } from "react";
import type * as THREE from "three";

interface Props {
  scrollProgress: number;
}

function Coin({
  position,
  speed,
  phase,
  scrollProgress,
}: {
  position: [number, number, number];
  speed: number;
  phase: number;
  scrollProgress: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y += speed;
    const t = clock.getElapsedTime();
    ref.current.position.set(
      position[0],
      position[1] + Math.sin(t * 0.4 + phase) * 0.15 + scrollProgress * 3,
      position[2],
    );
  });
  return (
    <mesh ref={ref} position={position}>
      <torusGeometry args={[0.4, 0.12, 8, 32]} />
      <meshStandardMaterial color="#f4c49a" metalness={0.9} roughness={0.1} />
    </mesh>
  );
}

function Envelope({ position }: { position: [number, number, number] }) {
  return (
    <Float speed={1.2} floatIntensity={0.6} rotationIntensity={0.4}>
      <mesh position={position}>
        <boxGeometry args={[0.5, 0.7, 0.04]} />
        <meshStandardMaterial color="#e91e8c" metalness={0.2} roughness={0.6} />
      </mesh>
    </Float>
  );
}

function CameraController() {
  const { camera, pointer } = useThree();
  useFrame(() => {
    camera.position.x += (pointer.x * 0.8 - camera.position.x) * 0.05;
    camera.position.y += (pointer.y * 0.4 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

const COINS: Array<[number, number, number, number, number]> = [
  [-4.5,  1.5, -3,   0.008, 0  ],
  [-3,   -2,   -1,   0.006, 1.2],
  [-2,    2.5, -2,   0.010, 2.4],
  [ 4,    0.5, -1,   0.007, 0.8],
  [ 3,   -1.5, -2,   0.012, 1.6],
  [-4,   -0.5,  0.5, 0.009, 3.0],
];

const ENVELOPES: Array<[number, number, number]> = [
  [ 4.5,  1.2, -1  ],
  [-4.2, -1.2,  0.3],
  [ 3.5, -2.0,  0.5],
];

export default function HeroScene({ scrollProgress }: Props) {
  const isLowSpec =
    typeof navigator !== "undefined" &&
    ((navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency ?? 8) <= 4;

  if (isLowSpec) return null;

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 50 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 1.5]}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1,
        opacity: 1 - scrollProgress,
      }}
    >
      <ambientLight intensity={0.4} />
      <pointLight color="#ffe4f2" intensity={1.2} position={[-2, 3, 4]} />
      <Stars radius={80} depth={40} count={300} factor={3} fade speed={0.4} />
      <CameraController />
      {COINS.map(([x, y, z, speed, phase], i) => (
        <Coin
          key={i}
          position={[x, y, z]}
          speed={speed}
          phase={phase}
          scrollProgress={scrollProgress}
        />
      ))}
      {ENVELOPES.map(([x, y, z], i) => (
        <Envelope key={i} position={[x, y, z]} />
      ))}
    </Canvas>
  );
}
