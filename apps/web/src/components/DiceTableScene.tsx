import { useRef } from "react";
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
    lid.current.rotation.x += (target - lid.current.rotation.x) * Math.min(delta * 5, 1);
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

function Table({ lidOpen }: DiceTableSceneProps) {
  return (
    <>
      <color attach="background" args={["#35180f"]} />
      <ambientLight intensity={1.2} />
      <directionalLight castShadow intensity={2.5} position={[4, 7, 5]} shadow-mapSize={[1024, 1024]} />
      <pointLight intensity={18} distance={12} color="#e49a58" position={[-4, 3, 2]} />
      <Bowl />
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
        <Table lidOpen={lidOpen} />
      </Canvas>
    </div>
  );
}
