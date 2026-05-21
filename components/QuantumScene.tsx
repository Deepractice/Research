/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Sphere, Line, Environment, useEnvironment } from '@react-three/drei';
import * as THREE from 'three';

// Preload the HDR environment so the first paint doesn't suspend the Canvas subtree.
// Per pmndrs/react-three-fiber discussion #2576: Suspense should live INSIDE Canvas,
// and the underlying asset should be preloaded to avoid first-frame flicker.
useEnvironment.preload({ preset: 'city' });

// Add type definitions for Three.js elements in JSX
declare global {
  namespace JSX {
    interface IntrinsicElements {
      meshStandardMaterial: any;
      group: any;
      ambientLight: any;
      pointLight: any;
      spotLight: any;
    }
  }
}

const MemoryNode = ({ position, color }: { position: [number, number, number]; color: string }) => {
  const ref = useRef<THREE.Mesh>(null);
  const originalY = position[1];
  
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.getElapsedTime();
      // Gentle floating independent of the group
      ref.current.position.y = originalY + Math.sin(t + position[0]) * 0.1;
      
      // Pulse scale slightly
      const scale = 1 + Math.sin(t * 2 + position[2]) * 0.1;
      ref.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <Sphere ref={ref} args={[0.12, 32, 32]} position={position}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        roughness={0.2}
        metalness={0.8}
      />
    </Sphere>
  );
};

const Connections = ({ points, color }: { points: [number, number, number][]; color: string }) => {
    // Create random connections between nearby nodes
    const lines = useMemo(() => {
        const l: [THREE.Vector3, THREE.Vector3][] = [];
        points.forEach((p1, i) => {
            points.forEach((p2, j) => {
                if (i < j) {
                    const dist = new THREE.Vector3(...p1).distanceTo(new THREE.Vector3(...p2));
                    if (dist < 2.5) {
                        l.push([new THREE.Vector3(...p1), new THREE.Vector3(...p2)]);
                    }
                }
            });
        });
        return l;
    }, [points]);

    return (
        <group>
            {lines.map((line, i) => (
                 <Line
                    key={i}
                    points={line}
                    color={color}
                    transparent
                    opacity={0.15}
                    lineWidth={1}
                 />
            ))}
        </group>
    )
}

const InteractiveGroup = ({ children }: { children: React.ReactNode }) => {
    const groupRef = useRef<THREE.Group>(null);
    const { mouse, viewport } = useThree();

    useFrame(() => {
        if (groupRef.current) {
            // Smoothly interpolate rotation based on mouse position
            // Mouse x/y are normalized (-1 to 1)
            const targetX = (mouse.y * viewport.height) / 100;
            const targetY = (mouse.x * viewport.width) / 100;

            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.05);
            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, 0.05);
        }
    });

    return <group ref={groupRef}>{children}</group>;
};

export const HeroScene: React.FC = () => {
  const nodeCount = 40;
  const nodes = useMemo(() => {
      // Generate nodes that avoid the center area where the title is
      const generatedNodes: [number, number, number][] = [];
      let attempts = 0;

      while (generatedNodes.length < nodeCount && attempts < 200) {
          const x = (Math.random() - 0.5) * 10;
          const y = (Math.random() - 0.5) * 6;
          const z = (Math.random() - 0.5) * 5;

          // Create a "dead zone" in the center for the title
          // Title is roughly in the center, so avoid x: -2.5 to 2.5, y: -1 to 1.5
          const inDeadZone = Math.abs(x) < 2.5 && y > -1 && y < 1.5;

          if (!inDeadZone) {
              generatedNodes.push([x, y, z]);
          }
          attempts++;
      }

      return generatedNodes;
  }, []);

  // Nobel Gold Palette
  const colors = ["#C5A059", "#A8A29E", "#57534E"]; // Gold, Stone-400, Stone-600

  return (
    <div className="absolute inset-0 z-0 opacity-90 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        {/* Warmer Lighting Setup */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#C5A059" />
        <pointLight position={[-10, -5, -10]} intensity={1.0} color="#E7E5E4" />
        <spotLight position={[0, 10, 0]} intensity={0.5} angle={0.5} penumbra={1} color="#C5A059" />

        <Float speed={1} rotationIntensity={0.2} floatIntensity={0.2}>
          <InteractiveGroup>
             {nodes.map((pos, i) => (
                 <MemoryNode key={i} position={pos} color={colors[i % 3]} />
             ))}
             <Connections points={nodes} color="#78716c" />
          </InteractiveGroup>
        </Float>

        {/* Suspense lives INSIDE Canvas so the Canvas itself never unmounts while
            the HDR loads (pmndrs/react-three-fiber discussion #2576). */}
        <Suspense fallback={null}>
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
};

export const NetworkScene: React.FC = () => {
  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <spotLight position={[5, 5, 5]} intensity={1.5} color="#C5A059" />
        <Suspense fallback={null}>
          <Environment preset="city" />
        </Suspense>

        <Float rotationIntensity={0.5} floatIntensity={0.2} speed={1.5}>
           <group>
             {/* Central Hub Node */}
             <Sphere args={[0.8, 32, 32]} position={[0, 0, 0]}>
                <meshStandardMaterial color="#C5A059" metalness={0.8} roughness={0.1} wireframe />
             </Sphere>
             <Sphere args={[0.6, 32, 32]} position={[0, 0, 0]}>
                <meshStandardMaterial color="#C5A059" emissive="#C5A059" emissiveIntensity={0.2} transparent opacity={0.6} />
             </Sphere>

             {/* Satellite Nodes */}
             <MemoryNode position={[2, 1, 0]} color="#44403C" />
             <MemoryNode position={[-2, -1, 0.5]} color="#C5A059" />
             <MemoryNode position={[0, 2, -1]} color="#A8A29E" />
             <MemoryNode position={[-1.5, 1.5, 1]} color="#44403C" />

             {/* Connecting Lines */}
             <Line points={[[0,0,0], [2,1,0]]} color="#C5A059" transparent opacity={0.3} />
             <Line points={[[0,0,0], [-2,-1,0.5]]} color="#C5A059" transparent opacity={0.3} />
             <Line points={[[0,0,0], [0,2,-1]]} color="#C5A059" transparent opacity={0.3} />
             <Line points={[[0,0,0], [-1.5,1.5,1]]} color="#C5A059" transparent opacity={0.3} />
           </group>
        </Float>
      </Canvas>
    </div>
  );
}