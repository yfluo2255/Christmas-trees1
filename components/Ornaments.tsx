import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState, COLORS } from '../types';

interface OrnamentsProps {
  treeState: TreeState;
}

const OrnamentSystem: React.FC<OrnamentsProps> = ({ treeState }) => {
  return (
    <group>
      {/* Deep Red Balls */}
      <InstancedOrnaments 
        type="sphere" count={120} color={COLORS.RICH_RED} 
        treeState={treeState} weight={1.0} scale={0.45} emissive={0.1}
      />
      {/* Royal Blue Balls */}
      <InstancedOrnaments 
        type="sphere" count={80} color={COLORS.ROYAL_BLUE} 
        treeState={treeState} weight={1.1} scale={0.45} emissive={0.15}
      />
      {/* Gold Balls */}
      <InstancedOrnaments 
        type="sphere" count={100} color={COLORS.GOLD} 
        treeState={treeState} weight={1.2} scale={0.5} emissive={0.3}
      />
      {/* Silver/White "Polaroid" Cards (Rectangular) */}
      <InstancedOrnaments 
        type="card" count={50} color={COLORS.SNOW_WHITE} 
        treeState={treeState} weight={0.8} scale={0.6} emissive={0.1}
      />
      {/* Gold Gift Boxes */}
      <InstancedOrnaments 
        type="box" count={40} color={COLORS.GOLD} 
        treeState={treeState} weight={0.9} scale={0.6} emissive={0.2}
      />
      
      {/* --- NEW ELEMENTS --- */}
      
      {/* Pinecones (Organic Wood texture) */}
      <InstancedOrnaments 
        type="pinecone" count={70} color={COLORS.WOOD} 
        treeState={treeState} weight={1.4} scale={0.4} emissive={0}
      />
      
      {/* Golden Bells (Classic shape) */}
      <InstancedOrnaments 
        type="bell" count={50} color={COLORS.BRONZE} 
        treeState={treeState} weight={1.3} scale={0.4} emissive={0.4}
      />

      {/* --- LIGHTS --- */}
      
      {/* Warm Lights - High density, smaller */}
      <InstancedOrnaments 
        type="sphere" count={600} color={COLORS.WARM_LIGHT} 
        treeState={treeState} weight={2.0} scale={0.1} emissive={5.0}
      />
    </group>
  );
};

interface InstancedProps {
  type: 'sphere' | 'box' | 'card' | 'pinecone' | 'bell';
  count: number;
  color: string;
  treeState: TreeState;
  weight: number; 
  scale: number;
  emissive: number;
}

const InstancedOrnaments: React.FC<InstancedProps> = ({ 
  type, count, color, treeState, weight, scale, emissive 
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Store dynamic state in a ref to avoid re-renders
  const progressRef = useRef(0);
  
  const data = useMemo(() => {
    const chaosPositions: THREE.Vector3[] = [];
    const targetPositions: THREE.Vector3[] = [];
    const rotations: THREE.Euler[] = [];
    
    // Match Foliage Dimensions
    const treeHeight = 17.5; // Slightly shorter than foliage to stay inside
    const baseRadius = 8.0;

    for (let i = 0; i < count; i++) {
      // Chaos
      const r = 25 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const cx = r * Math.sin(phi) * Math.cos(theta);
      const cy = r * Math.sin(phi) * Math.sin(theta) + 5;
      const cz = r * Math.cos(phi);
      chaosPositions.push(new THREE.Vector3(cx, cy, cz));

      // Target: Volumetric distribution
      const y = Math.random() * treeHeight;
      const maxR = baseRadius * (1 - y / treeHeight);
      
      // Distribution: Push ornaments mostly to the surface (0.7 to 1.0 of radius)
      // Lights can be deeper
      const depthMin = emissive > 1.0 ? 0.5 : 0.75;
      const depthBias = depthMin + (1 - depthMin) * Math.sqrt(Math.random()); 
      
      const rad = depthBias * maxR;
      const ang = Math.random() * Math.PI * 2;
      
      const tx = rad * Math.cos(ang);
      const ty = y - 7;
      const tz = rad * Math.sin(ang);
      
      targetPositions.push(new THREE.Vector3(tx, ty, tz));
      
      // Rotation
      rotations.push(new THREE.Euler(
        Math.random() * Math.PI, 
        Math.random() * Math.PI, 
        Math.random() * Math.PI
      ));
    }

    return { chaosPositions, targetPositions, rotations };
  }, [count, emissive]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Smooth state transition
    const targetP = treeState === TreeState.FORMED ? 1.0 : 0.0;
    // Different weights lerp at different speeds
    const lerpSpeed = 0.8 * delta * (1.0 + weight * 0.5); 
    
    progressRef.current = THREE.MathUtils.lerp(progressRef.current, targetP, lerpSpeed);
    const t = progressRef.current;
    
    // Smooth ease
    const ease = t * t * (3.0 - 2.0 * t);

    for (let i = 0; i < count; i++) {
      const chaos = data.chaosPositions[i];
      const target = data.targetPositions[i];
      
      dummy.position.lerpVectors(chaos, target, ease);
      
      // Floating noise
      if (t < 0.95) {
        dummy.position.x += Math.sin(state.clock.elapsedTime + i) * 0.03 * (1-ease);
        dummy.position.y += Math.cos(state.clock.elapsedTime * 0.8 + i) * 0.03 * (1-ease);
      } else {
        // Subtle sway when formed
        dummy.position.x += Math.sin(state.clock.elapsedTime * 1.5 + dummy.position.y * 0.2) * 0.01;
      }

      dummy.rotation.copy(data.rotations[i]);
      if (type !== 'sphere' && type !== 'pinecone') {
         dummy.rotation.x += delta * 0.2 * (1-ease);
         dummy.rotation.y += delta * 0.2 * (1-ease);
      }
      
      // Orient Pinecones and Bells upright or hanging nicely
      if (treeState === TreeState.FORMED && ease > 0.9) {
        if (type === 'pinecone') {
          // Pinecones sit upright-ish
           dummy.rotation.set(0, data.rotations[i].y, 0);
        } else if (type === 'bell') {
          // Bells hang down? Or just chaos rotation looks festive
           // Keep random for now as hanging logic needs normal vectors
        }
      }
      
      // Scale pop-in effect
      const finalScale = type === 'card' ? [scale * 0.7, scale * 1.0, scale * 0.1] : [scale, scale, scale];
      
      // Special scale for Pinecones (elongated)
      if (type === 'pinecone') {
        finalScale[1] *= 1.4; 
      }
      
      const s = (0.5 + 0.5 * ease);
      
      dummy.scale.set(
        finalScale[0] as number * s, 
        finalScale[1] as number * s, 
        finalScale[2] as number * s
      );
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Geometry selection
  const geometry = useMemo(() => {
    switch (type) {
      case 'sphere': return new THREE.SphereGeometry(1, 16, 16);
      case 'box': return new THREE.BoxGeometry(1, 1, 1);
      case 'card': return new THREE.BoxGeometry(1, 1, 1);
      case 'pinecone': return new THREE.DodecahedronGeometry(1, 0); // Low poly organic look
      case 'bell': return new THREE.CylinderGeometry(0.2, 0.8, 1.0, 16); // Flared cylinder
      default: return new THREE.SphereGeometry(1, 16, 16);
    }
  }, [type]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial 
        color={color} 
        roughness={type === 'card' ? 0.8 : (type === 'pinecone' ? 0.9 : 0.2)} 
        metalness={type === 'card' || type === 'pinecone' ? 0.0 : 0.8}
        emissive={color}
        emissiveIntensity={emissive}
      />
    </instancedMesh>
  );
};

export default OrnamentSystem;