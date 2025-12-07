import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { TreeState } from '../types';
import * as THREE from 'three';

interface StarProps {
  treeState: TreeState;
}

const Star: React.FC<StarProps> = ({ treeState }) => {
  const groupRef = useRef<THREE.Group>(null);
  const scaleRef = useRef(0);

  // Create 5-point star shape
  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const numPoints = 5;
    const outerRadius = 1.2;
    const innerRadius = 0.6;
    
    // Adjusted angle offset to make sure the star points UP (starts at 90 degrees / pi/2)
    for (let i = 0; i < numPoints * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      // Start at Math.PI / 2 to point up
      const angle = (i / (numPoints * 2)) * Math.PI * 2 + Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }, []);

  const extrudeSettings = {
    steps: 1,
    depth: 0.4,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.1,
    bevelSegments: 2
  };

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Scale up when formed, shrink when chaos
    const targetScale = treeState === TreeState.FORMED ? 1.0 : 0.0;
    scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetScale, delta * 3);
    
    groupRef.current.scale.setScalar(scaleRef.current);
    
    if (scaleRef.current > 0.01) {
       groupRef.current.rotation.y += delta * 0.5;
       // Gentle bobbing
       groupRef.current.position.y = 11 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[0, 11, 0]}>
      {/* 3D Star Mesh */}
      <mesh castShadow>
        <extrudeGeometry args={[starShape, extrudeSettings]} />
        <meshStandardMaterial 
           color="#FFD700" 
           emissive="#FFD700"
           emissiveIntensity={2}
           roughness={0.2}
           metalness={1}
        />
      </mesh>
      
      {/* Glow Halo */}
      <mesh position={[0, 0, -0.2]} scale={1.8}>
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.4} toneMapped={false} />
      </mesh>
      
      {/* Point Light Source */}
      <pointLight distance={15} intensity={8} color="#ffdd00" decay={2} />
    </group>
  );
};

export default Star;