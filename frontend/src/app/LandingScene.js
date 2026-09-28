'use client';

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Points, PointMaterial, Environment, Sphere, MeshDistortMaterial, Html } from '@react-three/drei';
import * as THREE from 'three';

const EMOTION_COLORS = {
  calm: '#60a5fa',
  joy: '#fbbf24',
  curious: '#a855f7',
  intimate: '#f43f5e',
};

function CameraController() {
  const { camera } = useThree();
  
  useFrame((state) => {
    if (typeof window === 'undefined') return;
    
    const scrollY = window.scrollY;
    // We use document.documentElement.scrollHeight for better accuracy
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const progress = maxScroll > 0 ? Math.min(Math.max(scrollY / maxScroll, 0), 1) : 0;
    
    let targetX = 0;
    let targetY = 0;
    let targetZ = 8;
    
    if (progress < 0.25) { // Hero -> Presence
       const p = progress / 0.25;
       targetZ = THREE.MathUtils.lerp(8, 5, p);
       targetX = THREE.MathUtils.lerp(0, 3, p);
    } else if (progress < 0.5) { // Presence -> Emotion
       const p = (progress - 0.25) / 0.25;
       targetZ = THREE.MathUtils.lerp(5, 5.5, p);
       targetX = THREE.MathUtils.lerp(3, -3, p);
       targetY = THREE.MathUtils.lerp(0, 1, p);
    } else if (progress < 0.75) { // Emotion -> Memory
       const p = (progress - 0.5) / 0.25;
       targetZ = THREE.MathUtils.lerp(5.5, 14, p);
       targetX = THREE.MathUtils.lerp(-3, 0, p);
       targetY = THREE.MathUtils.lerp(1, -1, p);
    } else { // Memory -> CTA
       const p = (progress - 0.75) / 0.25;
       targetZ = THREE.MathUtils.lerp(14, 6, p);
       targetX = 0;
       targetY = THREE.MathUtils.lerp(-1, 0, p);
    }
    
    // Smooth mouse parallax
    const mouseX = (state.pointer.x * 1.5);
    const mouseY = (state.pointer.y * 1.5);
    
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX + mouseX, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY + mouseY, 0.05);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.05);
    
    camera.lookAt(0, 0, 0);
  });
  
  return null;
}

function Starfield() {
  const ref = useRef();
  
  const positions = useMemo(() => {
    const count = 1000;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 20; 
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta * 0.02;
      ref.current.rotation.y -= delta * 0.03;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#ffffff" size={0.03} sizeAttenuation={true} depthWrite={false} opacity={0.3} />
    </Points>
  );
}

function Constellation() {
  const ref = useRef();
  const positions = useMemo(() => {
    const count = 400;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 8 + Math.random() * 8; 
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#a855f7" size={0.04} sizeAttenuation={true} depthWrite={false} opacity={0.5} />
    </Points>
  );
}

function MemoryNode({ data, index, setHoveredNode }) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef();

  useFrame((state) => {
    if(meshRef.current) {
        meshRef.current.position.y = data.pos[1] + Math.sin(state.clock.elapsedTime * 1.5 + index) * 0.4;
        const scale = hovered ? 1.4 : 1;
        meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }
  });

  return (
    <group position={[data.pos[0], 0, data.pos[2]]}>
      <Float speed={2} floatIntensity={1}>
        <mesh 
          ref={meshRef} 
          onPointerOver={(e) => { 
            e.stopPropagation(); 
            setHovered(true); 
            setHoveredNode(true);
          }}
          onPointerOut={(e) => { 
            e.stopPropagation(); 
            setHovered(false); 
            setHoveredNode(false);
          }}
        >
          <sphereGeometry args={[0.35, 32, 32]} />
          <meshStandardMaterial 
            color={hovered ? '#ffffff' : data.color} 
            emissive={hovered ? '#ffffff' : data.color}
            emissiveIntensity={hovered ? 0.8 : 0.4}
            roughness={0.1}
            metalness={0.8}
            transparent
            opacity={0.9}
          />
          {hovered && (
            <Html center distanceFactor={12} className="node-tooltip">
              <div className="glass-panel">
                <h4>{data.label}</h4>
                <p>{data.desc}</p>
              </div>
            </Html>
          )}
        </mesh>
      </Float>
    </group>
  );
}

function MemoryNodes({ setHoveredNode }) {
  const group = useRef();
  const nodes = useMemo(() => [
    { id: 1, label: 'Memory', desc: 'That conversation from last Tuesday.', pos: [-3.5, 1.5, -1], color: '#fbbf24' },
    { id: 2, label: 'Friendship', desc: 'A lasting emotional bond.', pos: [3.5, 0.5, -2], color: '#a855f7' },
    { id: 3, label: 'Comfort', desc: 'A safe space to reflect.', pos: [-2, -2.5, 1.5], color: '#60a5fa' },
    { id: 4, label: 'Curiosity', desc: 'Exploring the unknown.', pos: [2.5, -2, -1], color: '#f43f5e' },
    { id: 5, label: 'Connection', desc: 'Shared moments in time.', pos: [0, 3.5, -2.5], color: '#34d399' },
  ], []);

  useFrame((state) => {
    if(group.current) {
        group.current.rotation.y = state.clock.getElapsedTime() * 0.05;
        group.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.05;
    }
  });

  return (
    <group ref={group}>
      {nodes.map((node, i) => (
        <MemoryNode key={node.id} data={node} index={i} setHoveredNode={setHoveredNode} />
      ))}
    </group>
  );
}

function CentralCore({ emotion, hoveredCta }) {
  const materialRef = useRef();
  const sphereRef = useRef();
  const targetColor = useMemo(() => new THREE.Color(EMOTION_COLORS[emotion] || '#a855f7'), [emotion]);
  
  useFrame((state) => {
    const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * (hoveredCta ? 0.06 : 0.02);
    if(sphereRef.current) sphereRef.current.scale.set(scale, scale, scale);
    
    if (materialRef.current) {
      materialRef.current.color.lerp(targetColor, 0.03);
      materialRef.current.emissive.lerp(targetColor, 0.03);
      materialRef.current.distort = THREE.MathUtils.lerp(
         materialRef.current.distort,
         hoveredCta ? 0.6 : 0.35,
         0.05
      );
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <Sphere ref={sphereRef} args={[1.8, 128, 128]}>
        <MeshDistortMaterial
          ref={materialRef}
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={0.5}
          distort={0.35}
          speed={2}
          roughness={0.1}
          metalness={0.9}
          transparent={true}
          opacity={0.85}
        />
      </Sphere>
      <Sphere args={[1.6, 32, 32]}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.05} />
      </Sphere>
    </Float>
  );
}

export default function LandingScene({ emotion, hoveredCta, setHoveredNode }) {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 2]}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-10, -10, -5]} intensity={2} color={EMOTION_COLORS[emotion] || '#c084fc'} />
      <pointLight position={[0, 0, 0]} intensity={2.5} color={EMOTION_COLORS[emotion] || '#f472b6'} distance={15} />
      
      <CameraController />
      <Starfield />
      <Constellation />
      <CentralCore emotion={emotion} hoveredCta={hoveredCta} />
      <MemoryNodes setHoveredNode={setHoveredNode} />
      
      <Environment preset="city" />
    </Canvas>
  );
}
