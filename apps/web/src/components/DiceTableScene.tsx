import { useRef } from "react";
import { DIE_FACE_SYMBOLS } from "@kla-khlok/shared";
import { CuboidCollider, Physics, RigidBody } from "@react-three/rapier";
import { Canvas, useFrame } from "@react-three/fiber";
import { Vector2 } from "three";
import type { Group } from "three";

interface DiceTableSceneProps {
  readonly lidOpen: boolean;
}

function Bowl() {
  return (
    <group>
      <mesh receiveShadow rotation={[0, 0, 0]}>
        <latheGeometry
          args={[
            [
              new Vector2(0, -0.25),
              new Vector2(2.25, -0.25),
              new Vector2(2.6, 0.05),
              new Vector2(2.45, 0.42),
            ],
            64,
          ]}
        />
        <meshStandardMaterial color="#7b351f" roughness={0.62} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.43, 0]} receiveShadow>
        <torusGeometry args={[2.45, 0.12, 16, 64]} />
        <meshStandardMaterial color="#d9954a" roughness={0.48} metalness={0.15} />
      </mesh>
    </group>
  );
}

function Lid({ open }: { readonly open: boolean }) {
  const lid = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!lid.current) return;
    const target = open ? -0.82 : 0;
    const targetY = open ? 2.2 : 0.75;
    const targetZ = open ? 0.8 : 1.75;
    lid.current.rotation.x += (target - lid.current.rotation.x) * Math.min(delta * 5, 1);
    lid.current.position.y += (targetY - lid.current.position.y) * Math.min(delta * 5, 1);
    lid.current.position.z += (targetZ - lid.current.position.z) * Math.min(delta * 5, 1);
  });

  return (
    <group ref={lid} position={[0, 0.75, 1.75]}>
      <mesh castShadow>
        <cylinderGeometry args={[2.5, 2.25, 0.22, 64]} />
        <meshStandardMaterial color="#9b4b26" roughness={0.55} metalness={0.12} />
      </mesh>
      <mesh position={[0, 0.2, 0]} castShadow>
        <sphereGeometry args={[0.3, 24, 12]} />
        <meshStandardMaterial color="#e4a054" roughness={0.42} metalness={0.2} />
      </mesh>
    </group>
  );
}

const dieFaceColors = ["#e8b451", "#b94e37", "#f3d6a0", "#d9793e", "#f1e5c8", "#8d3e2b"];

function Die({ position, rotation }: { readonly position: [number, number, number]; readonly rotation: [number, number, number] }) {
  return (
    <RigidBody colliders="cuboid" position={position} rotation={rotation} restitution={0.45} friction={0.75}>
      <mesh castShadow>
        <boxGeometry args={[0.82, 0.82, 0.82]} />
        {dieFaceColors.map((color, index) => (
          <meshStandardMaterial key={DIE_FACE_SYMBOLS[index]} attach={`material-${index}`} color={color} roughness={0.48} />
        ))}
      </mesh>
    </RigidBody>
  );
}

function Dice() {
  return (
    <group aria-label="Three dice">
      <Die position={[-0.95, 0.25, 0]} rotation={[0.24, 0.36, 0.1]} />
      <Die position={[0, 0.28, -0.2]} rotation={[-0.18, 0.62, -0.16]} />
      <Die position={[0.95, 0.24, 0.06]} rotation={[0.14, -0.48, 0.2]} />
    </group>
  );
}

function ContainmentColliders() {
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[3.15, 0.2, 3.15]} position={[0, -0.4, 0]} />
      <CuboidCollider args={[0.2, 1.1, 3.15]} position={[-3, 0.65, 0]} />
      <CuboidCollider args={[0.2, 1.1, 3.15]} position={[3, 0.65, 0]} />
      <CuboidCollider args={[3.15, 1.1, 0.2]} position={[0, 0.65, -3]} />
      <CuboidCollider args={[3.15, 1.1, 0.2]} position={[0, 0.65, 3]} />
    </RigidBody>
  );
}

function Table({ lidOpen }: DiceTableSceneProps) {
  return (
    <>
      <color attach="background" args={["#35180f"]} />
      <ambientLight intensity={1.2} />
      <directionalLight castShadow intensity={2.5} position={[4, 7, 5]} shadow-mapSize={[1024, 1024]} />
      <pointLight intensity={18} distance={12} color="#e49a58" position={[-4, 3, 2]} />
      <Bowl />
      <Dice />
      <ContainmentColliders />
      <Lid open={lidOpen} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.42, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#28130d" roughness={0.9} />
      </mesh>
    </>
  );
}

export function DiceTableScene({ lidOpen }: DiceTableSceneProps) {
  return (
    <div className="scene-frame" aria-label="3D Kla Khlok bowl and lid scene">
      <Canvas shadows camera={{ position: [0, 4.1, 6.8], fov: 42 }}>
        <Physics gravity={[0, -9.81, 0]}>
          <Table lidOpen={lidOpen} />
        </Physics>
      </Canvas>
    </div>
  );
}
