/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { Sphere, Line, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

// Node types matching the paper's Engram schema
type NodeType = 'query' | 'concept' | 'raw';

interface EngramNode {
  id: number;
  position: [number, number, number];
  label: string;
  type: NodeType;
}

interface EngramEdge {
  source: number;
  target: number;
}

interface NodeProps {
  node: EngramNode;
  activation: number;
  onActivate: (id: number) => void;
}

// Individual 3D Node with glow effect
const Node3D: React.FC<NodeProps> = ({ node, activation, onActivate }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Animate based on activation level
  useFrame((state) => {
    if (meshRef.current && glowRef.current) {
      const t = state.clock.getElapsedTime();

      // Pulse effect when activated
      const pulseScale = activation > 0.1
        ? 1 + Math.sin(t * 4) * 0.15 * activation
        : 1;

      meshRef.current.scale.setScalar(pulseScale);

      // Glow expansion
      const glowScale = 1.5 + activation * 1.5;
      glowRef.current.scale.setScalar(glowScale);
    }
  });

  // Colors based on node type
  const getColors = () => {
    switch (node.type) {
      case 'query':
        return { core: '#1c1917', glow: '#C5A059', emissive: '#C5A059' };
      case 'concept':
        return { core: '#57534E', glow: '#C5A059', emissive: '#A8A29E' };
      case 'raw':
        return { core: '#78716C', glow: '#C5A059', emissive: '#D6D3D1' };
    }
  };

  const colors = getColors();
  const size = node.type === 'query' ? 0.35 : node.type === 'concept' ? 0.25 : 0.2;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onActivate(node.id);
  };

  return (
    <group position={node.position}>
      {/* Glow sphere (only visible when activated) */}
      <Sphere ref={glowRef} args={[size, 16, 16]}>
        <meshBasicMaterial
          color={colors.glow}
          transparent
          opacity={activation * 0.4}
          depthWrite={false}
        />
      </Sphere>

      {/* Core sphere */}
      <Sphere
        ref={meshRef}
        args={[size, 32, 32]}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={activation > 0.1 ? colors.glow : colors.core}
          emissive={colors.emissive}
          emissiveIntensity={activation > 0.1 ? 0.8 + activation * 0.5 : 0.1}
          roughness={0.3}
          metalness={0.7}
        />
      </Sphere>

      {/* Ring for query node */}
      {node.type === 'query' && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size + 0.1, size + 0.15, 32]} />
          <meshBasicMaterial
            color="#C5A059"
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Label */}
      <Html
        position={[0, size + 0.3, 0]}
        center
        style={{
          transition: 'all 0.2s',
          opacity: hovered || activation > 0.1 ? 1 : 0.7,
          pointerEvents: 'none',
        }}
      >
        <div
          className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap backdrop-blur-sm border transition-all ${
            activation > 0.1
              ? 'bg-nobel-gold/90 text-white border-nobel-gold'
              : 'bg-white/90 text-stone-600 border-stone-200'
          }`}
        >
          {node.label}
        </div>
      </Html>
    </group>
  );
};

// Connection line with activation animation
interface EdgeProps {
  edge: EngramEdge;
  nodes: EngramNode[];
  activations: Map<number, number>;
}

const Edge3D: React.FC<EdgeProps> = ({ edge, nodes, activations }) => {
  const lineRef = useRef<THREE.Line>(null);

  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);

  if (!sourceNode || !targetNode) return null;

  const sourceActivation = activations.get(edge.source) || 0;
  const targetActivation = activations.get(edge.target) || 0;
  const maxActivation = Math.max(sourceActivation, targetActivation);

  return (
    <Line
      ref={lineRef}
      points={[sourceNode.position, targetNode.position]}
      color={maxActivation > 0.1 ? '#C5A059' : '#A8A29E'}
      transparent
      opacity={maxActivation > 0.1 ? 0.6 + maxActivation * 0.4 : 0.15}
      lineWidth={maxActivation > 0.1 ? 2 : 1}
    />
  );
};

// Pulse wave effect
interface PulseWaveProps {
  origin: [number, number, number];
  startTime: number;
}

const PulseWave: React.FC<PulseWaveProps> = ({ origin, startTime }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [visible, setVisible] = useState(true);

  useFrame((state) => {
    if (meshRef.current) {
      const elapsed = state.clock.getElapsedTime() - startTime;
      const scale = elapsed * 3;
      const opacity = Math.max(0, 1 - elapsed * 0.5);

      if (opacity <= 0) {
        setVisible(false);
        return;
      }

      meshRef.current.scale.setScalar(scale);
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity * 0.3;
    }
  });

  if (!visible) return null;

  return (
    <mesh ref={meshRef} position={origin}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial
        color="#C5A059"
        transparent
        opacity={0.3}
        depthWrite={false}
        side={THREE.BackSide}
      />
    </mesh>
  );
};

// Main scene component
interface SceneProps {
  nodes: EngramNode[];
  edges: EngramEdge[];
  activations: Map<number, number>;
  pulseWaves: { origin: [number, number, number]; startTime: number }[];
  onActivate: (id: number) => void;
}

const Scene: React.FC<SceneProps> = ({ nodes, edges, activations, pulseWaves, onActivate }) => {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.2} color="#C5A059" />
      <pointLight position={[-10, -10, -10]} intensity={0.8} color="#E7E5E4" />
      <spotLight
        position={[0, 10, 0]}
        intensity={0.6}
        angle={0.5}
        penumbra={1}
        color="#C5A059"
      />

      {/* Edges */}
      {edges.map((edge, i) => (
        <Edge3D key={i} edge={edge} nodes={nodes} activations={activations} />
      ))}

      {/* Nodes */}
      {nodes.map((node) => (
        <Node3D
          key={node.id}
          node={node}
          activation={activations.get(node.id) || 0}
          onActivate={onActivate}
        />
      ))}

      {/* Pulse waves */}
      {pulseWaves.map((wave, i) => (
        <PulseWave key={i} origin={wave.origin} startTime={wave.startTime} />
      ))}

      {/* Controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={10}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
};

// Main exported component
export const EngramNetwork3D: React.FC = () => {
  // Define nodes based on paper's example
  const nodes: EngramNode[] = useMemo(() => [
    { id: 0, position: [0, 0, 0], label: 'Query: "Orders Slow"', type: 'query' },
    { id: 1, position: [-1.5, 1, 0.5], label: 'Latency', type: 'concept' },
    { id: 2, position: [1.5, 1, -0.5], label: 'DB Index', type: 'concept' },
    { id: 3, position: [-2, -0.5, 1], label: 'Timeout Error', type: 'raw' },
    { id: 4, position: [2, -0.5, -1], label: 'Index Optimization', type: 'raw' },
    { id: 5, position: [0, -1.5, 0], label: 'Optimization Plan', type: 'concept' },
  ], []);

  // Define edges (connections between nodes) - matching paper's example
  const edges: EngramEdge[] = useMemo(() => [
    { source: 0, target: 1 },  // Query -> Latency
    { source: 0, target: 2 },  // Query -> DB Index
    { source: 1, target: 3 },  // Latency -> Timeout Error
    { source: 2, target: 4 },  // DB Index -> Index Optimization
    { source: 4, target: 5 },  // Index Optimization -> Optimization Plan
    { source: 1, target: 2 },  // Latency <-> DB Index (cross concept)
  ], []);

  // Activation state for each node
  const [activations, setActivations] = useState<Map<number, number>>(new Map());
  const [pulseWaves, setPulseWaves] = useState<{ origin: [number, number, number]; startTime: number }[]>([]);
  const clockRef = useRef(0);

  // Activation diffusion logic
  const handleActivate = useCallback((id: number) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return;

    // Add pulse wave
    setPulseWaves(prev => [...prev, { origin: node.position, startTime: clockRef.current }]);

    // Set initial activation
    setActivations(prev => {
      const newMap = new Map(prev);
      newMap.set(id, 1);
      return newMap;
    });

    // Spread activation to neighbors over time
    const spreadActivation = (sourceId: number, strength: number, depth: number) => {
      if (depth > 3 || strength < 0.1) return;

      setTimeout(() => {
        const connectedEdges = edges.filter(e => e.source === sourceId || e.target === sourceId);

        connectedEdges.forEach(edge => {
          const neighborId = edge.source === sourceId ? edge.target : edge.source;
          const transferStrength = strength * 0.6;

          setActivations(prev => {
            const newMap = new Map(prev);
            const currentActivation = newMap.get(neighborId) || 0;
            if (transferStrength > currentActivation) {
              newMap.set(neighborId, transferStrength);
            }
            return newMap;
          });

          // Add pulse wave for activated neighbor
          const neighborNode = nodes.find(n => n.id === neighborId);
          if (neighborNode && transferStrength > 0.2) {
            setPulseWaves(prev => [...prev, { origin: neighborNode.position, startTime: clockRef.current }]);
          }

          spreadActivation(neighborId, transferStrength, depth + 1);
        });
      }, 400 * depth);
    };

    spreadActivation(id, 1, 1);

    // Decay activations over time
    const decayInterval = setInterval(() => {
      setActivations(prev => {
        const newMap = new Map();
        let hasActiveNodes = false;

        prev.forEach((value, key) => {
          const newValue = value * 0.95;
          if (newValue > 0.05) {
            newMap.set(key, newValue);
            hasActiveNodes = true;
          }
        });

        if (!hasActiveNodes) {
          clearInterval(decayInterval);
        }

        return newMap;
      });
    }, 100);

    // Cleanup old pulse waves
    setTimeout(() => {
      setPulseWaves([]);
    }, 3000);
  }, [nodes, edges]);

  // Update clock reference
  const updateClock = useCallback((time: number) => {
    clockRef.current = time;
  }, []);

  return (
    <div className="flex flex-col items-center p-4 md:p-8 bg-white rounded-sm shadow-sm border border-stone-200 my-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 rounded-full bg-nobel-gold animate-pulse" />
        <h3 className="font-serif text-xl text-stone-900">3D Engram Activation-Diffusion</h3>
      </div>

      <p className="text-sm text-stone-500 mb-6 text-center max-w-md">
        Click any node to trigger <strong>spreading activation</strong>. Drag to rotate, scroll to zoom.
        Watch how memories activate through conceptual links.
      </p>

      <div className="relative w-full max-w-2xl h-[350px] md:h-[450px] bg-gradient-to-b from-[#FAFAF9] to-[#E7E5E4] rounded-sm border border-stone-200 overflow-hidden">
        <Canvas
          camera={{ position: [0, 2, 5], fov: 50 }}
          onCreated={({ clock }) => {
            const animate = () => {
              updateClock(clock.getElapsedTime());
              requestAnimationFrame(animate);
            };
            animate();
          }}
        >
          <Scene
            nodes={nodes}
            edges={edges}
            activations={activations}
            pulseWaves={pulseWaves}
            onActivate={handleActivate}
          />
        </Canvas>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs font-mono text-stone-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-stone-900 ring-2 ring-nobel-gold ring-offset-1" />
          Query
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-stone-500" />
          Concept
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-stone-400" />
          Raw Memory
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-nobel-gold shadow-lg shadow-nobel-gold/50" />
          Activated
        </div>
      </div>
    </div>
  );
};
