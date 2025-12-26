/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { Sphere, OrbitControls, Html, QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';

// Node types matching the paper's Engram schema
type NodeType = 'query' | 'concept' | 'raw';

interface EngramNode {
  id: number;
  position: [number, number, number];
  label: string;
  shortLabel: string;
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

// Enhanced 3D Node with better visuals
const Node3D: React.FC<NodeProps> = ({ node, activation, onActivate }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Animate based on activation level
  useFrame((state) => {
    if (meshRef.current && glowRef.current && outerGlowRef.current) {
      const t = state.clock.getElapsedTime();

      // Gentle floating animation
      const floatY = Math.sin(t * 0.8 + node.id) * 0.05;
      meshRef.current.position.y = floatY;
      glowRef.current.position.y = floatY;
      outerGlowRef.current.position.y = floatY;

      // Pulse effect when activated
      const pulseScale = activation > 0.1
        ? 1 + Math.sin(t * 5) * 0.1 * activation
        : 1 + Math.sin(t * 2) * 0.02;

      meshRef.current.scale.setScalar(pulseScale);

      // Inner glow
      const glowScale = 1.3 + activation * 0.5;
      glowRef.current.scale.setScalar(glowScale);

      // Outer glow (larger, more diffuse)
      const outerGlowScale = 1.8 + activation * 1.2;
      outerGlowRef.current.scale.setScalar(outerGlowScale);
    }
  });

  // Colors based on node type - more vibrant and distinct
  const getColors = () => {
    switch (node.type) {
      case 'query':
        return {
          core: '#C5A059',
          glow: '#C5A059',
          emissive: '#C5A059',
          outerGlow: '#C5A059'
        };
      case 'concept':
        return {
          core: '#3B82F6',
          glow: '#60A5FA',
          emissive: '#3B82F6',
          outerGlow: '#93C5FD'
        };
      case 'raw':
        return {
          core: '#8B5CF6',
          glow: '#A78BFA',
          emissive: '#8B5CF6',
          outerGlow: '#C4B5FD'
        };
    }
  };

  const colors = getColors();
  const size = node.type === 'query' ? 0.4 : node.type === 'concept' ? 0.3 : 0.25;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onActivate(node.id);
  };

  const isActive = activation > 0.1;

  return (
    <group position={node.position}>
      {/* Outer glow sphere (very soft, large) */}
      <Sphere ref={outerGlowRef} args={[size, 16, 16]}>
        <meshBasicMaterial
          color={colors.outerGlow}
          transparent
          opacity={isActive ? activation * 0.15 : 0.03}
          depthWrite={false}
        />
      </Sphere>

      {/* Inner glow sphere */}
      <Sphere ref={glowRef} args={[size, 16, 16]}>
        <meshBasicMaterial
          color={colors.glow}
          transparent
          opacity={isActive ? activation * 0.4 : 0.08}
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
          color={colors.core}
          emissive={colors.emissive}
          emissiveIntensity={isActive ? 0.6 + activation * 0.8 : hovered ? 0.4 : 0.2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>

      {/* Ring for query node */}
      {node.type === 'query' && (
        <>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[size + 0.12, size + 0.18, 64]} />
            <meshBasicMaterial
              color="#C5A059"
              transparent
              opacity={isActive ? 1 : 0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[size + 0.25, size + 0.28, 64]} />
            <meshBasicMaterial
              color="#C5A059"
              transparent
              opacity={isActive ? 0.5 : 0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
        </>
      )}

      {/* Label - positioned below node */}
      <Html
        position={[0, -size - 0.4, 0]}
        center
        style={{
          transition: 'all 0.3s',
          opacity: 1,
          pointerEvents: 'none',
          transform: 'translateY(0)',
        }}
      >
        <div
          className={`px-3 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap shadow-lg transition-all duration-300 ${
            isActive
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white scale-110'
              : hovered
              ? 'bg-white text-stone-800 scale-105 border-2 border-stone-300'
              : 'bg-white/95 text-stone-700 border border-stone-200'
          }`}
          style={{
            textShadow: isActive ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
          }}
        >
          {node.shortLabel}
        </div>
      </Html>
    </group>
  );
};

// Enhanced curved connection line
interface EdgeProps {
  edge: EngramEdge;
  nodes: EngramNode[];
  activations: Map<number, number>;
}

const Edge3D: React.FC<EdgeProps> = ({ edge, nodes, activations }) => {
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);

  if (!sourceNode || !targetNode) return null;

  const sourceActivation = activations.get(edge.source) || 0;
  const targetActivation = activations.get(edge.target) || 0;
  const maxActivation = Math.max(sourceActivation, targetActivation);
  const isActive = maxActivation > 0.1;

  // Calculate midpoint with curve offset
  const midPoint: [number, number, number] = [
    (sourceNode.position[0] + targetNode.position[0]) / 2,
    (sourceNode.position[1] + targetNode.position[1]) / 2 + 0.3,
    (sourceNode.position[2] + targetNode.position[2]) / 2 + 0.2,
  ];

  return (
    <>
      {/* Main line */}
      <QuadraticBezierLine
        start={sourceNode.position}
        end={targetNode.position}
        mid={midPoint}
        color={isActive ? '#C5A059' : '#94A3B8'}
        opacity={isActive ? 0.8 + maxActivation * 0.2 : 0.3}
        transparent
        lineWidth={isActive ? 3 : 1.5}
      />
      {/* Glow line when active */}
      {isActive && (
        <QuadraticBezierLine
          start={sourceNode.position}
          end={targetNode.position}
          mid={midPoint}
          color="#C5A059"
          opacity={maxActivation * 0.3}
          transparent
          lineWidth={6}
        />
      )}
    </>
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
      const scale = elapsed * 2.5;
      const opacity = Math.max(0, 1 - elapsed * 0.4);

      if (opacity <= 0) {
        setVisible(false);
        return;
      }

      meshRef.current.scale.setScalar(scale);
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity * 0.25;
    }
  });

  if (!visible) return null;

  return (
    <mesh ref={meshRef} position={origin}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial
        color="#C5A059"
        transparent
        opacity={0.25}
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
      {/* Enhanced Lighting */}
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 8, 5]} intensity={1.5} color="#FFF7ED" />
      <pointLight position={[-5, -5, -5]} intensity={0.6} color="#E0E7FF" />
      <pointLight position={[0, -5, 5]} intensity={0.4} color="#F5D0FE" />
      <spotLight
        position={[0, 10, 0]}
        intensity={0.8}
        angle={0.6}
        penumbra={1}
        color="#FEF3C7"
      />

      {/* Edges (render first, behind nodes) */}
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
        minDistance={4}
        maxDistance={12}
        autoRotate
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI * 0.75}
        minPolarAngle={Math.PI * 0.25}
      />
    </>
  );
};

// Main exported component
export const EngramNetwork3D: React.FC = () => {
  // Redesigned node layout - clearer hierarchy, no overlapping labels
  const nodes: EngramNode[] = useMemo(() => [
    // Center: Query node
    { id: 0, position: [0, 0.5, 0], label: 'Query: "Orders Slow"', shortLabel: '🔍 Orders Slow', type: 'query' },
    // Upper layer: Concept nodes (spread horizontally)
    { id: 1, position: [-2, 1.2, 0.8], label: 'Latency', shortLabel: 'Latency', type: 'concept' },
    { id: 2, position: [2, 1.2, -0.8], label: 'DB Index', shortLabel: 'DB Index', type: 'concept' },
    // Lower layer: Raw memory nodes (spread wider)
    { id: 3, position: [-2.8, -0.8, 0.5], label: 'Timeout Error', shortLabel: 'Timeout Error', type: 'raw' },
    { id: 4, position: [2.8, -0.8, -0.5], label: 'Index Optimization', shortLabel: 'Index Optimize', type: 'raw' },
    // Bottom: Result concept
    { id: 5, position: [0, -1.5, 0], label: 'Optimization Plan', shortLabel: 'Optimize Plan', type: 'concept' },
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

  // Refs to track timers for cleanup
  const decayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const spreadTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const pulseCleanupRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function for all timers
  const cleanupTimers = useCallback(() => {
    if (decayIntervalRef.current) {
      clearInterval(decayIntervalRef.current);
      decayIntervalRef.current = null;
    }
    spreadTimeoutsRef.current.forEach(t => clearTimeout(t));
    spreadTimeoutsRef.current = [];
    if (pulseCleanupRef.current) {
      clearTimeout(pulseCleanupRef.current);
      pulseCleanupRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanupTimers();
  }, [cleanupTimers]);

  // Activation diffusion logic
  const handleActivate = useCallback((id: number) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return;

    // Clear previous timers before starting new activation
    cleanupTimers();

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

      const timeoutId = setTimeout(() => {
        const connectedEdges = edges.filter(e => e.source === sourceId || e.target === sourceId);

        connectedEdges.forEach(edge => {
          const neighborId = edge.source === sourceId ? edge.target : edge.source;
          const transferStrength = strength * 0.65;

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
      }, 350 * depth);

      spreadTimeoutsRef.current.push(timeoutId);
    };

    spreadActivation(id, 1, 1);

    // Decay activations over time
    decayIntervalRef.current = setInterval(() => {
      setActivations(prev => {
        const newMap = new Map();
        let hasActiveNodes = false;

        prev.forEach((value, key) => {
          const newValue = value * 0.96;
          if (newValue > 0.05) {
            newMap.set(key, newValue);
            hasActiveNodes = true;
          }
        });

        if (!hasActiveNodes && decayIntervalRef.current) {
          clearInterval(decayIntervalRef.current);
          decayIntervalRef.current = null;
        }

        return newMap;
      });
    }, 80);

    // Cleanup old pulse waves
    pulseCleanupRef.current = setTimeout(() => {
      setPulseWaves([]);
    }, 4000);
  }, [nodes, edges, cleanupTimers]);

  // Update clock reference
  const updateClock = useCallback((time: number) => {
    clockRef.current = time;
  }, []);

  return (
    <div className="flex flex-col items-center p-4 md:p-8 bg-gradient-to-br from-slate-50 to-stone-100 rounded-xl shadow-lg border border-stone-200 my-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 animate-pulse shadow-lg shadow-amber-200" />
        <h3 className="font-serif text-xl md:text-2xl text-stone-800 font-semibold">
          Engram Activation-Diffusion
        </h3>
      </div>

      <p className="text-sm text-stone-600 mb-6 text-center max-w-lg leading-relaxed">
        Click any node to trigger <strong className="text-amber-600">spreading activation</strong>.
        Watch how memories activate through conceptual links — not keyword matching.
      </p>

      <div className="relative w-full max-w-3xl h-[380px] md:h-[480px] bg-gradient-to-b from-slate-100 via-white to-slate-50 rounded-xl border border-stone-200 shadow-inner overflow-hidden">
        <Canvas
          camera={{ position: [0, 1.5, 6], fov: 45 }}
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

        {/* Click hint overlay */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-medium">
          👆 Click nodes to activate • Drag to rotate
        </div>
      </div>

      {/* Enhanced Legend */}
      <div className="mt-6 flex flex-wrap gap-6 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 shadow-md shadow-amber-200/50 ring-2 ring-amber-300 ring-offset-2" />
          <span className="text-sm font-medium text-stone-700">Query</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 shadow-md shadow-blue-200/50" />
          <span className="text-sm font-medium text-stone-700">Concept</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-violet-400 to-purple-500 shadow-md shadow-violet-200/50" />
          <span className="text-sm font-medium text-stone-700">Raw Memory</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 shadow-lg shadow-amber-300/80 animate-pulse" />
          <span className="text-sm font-medium text-stone-700">Activated</span>
        </div>
      </div>
    </div>
  );
};
