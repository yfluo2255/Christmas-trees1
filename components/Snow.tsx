import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Snow: React.FC = () => {
  const count = 1000;
  const geomRef = useRef<THREE.BufferGeometry>(null);
  
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  
  for(let i=0; i<count; i++) {
    positions[i*3] = (Math.random() - 0.5) * 40;
    positions[i*3+1] = (Math.random() - 0.5) * 40 + 10;
    positions[i*3+2] = (Math.random() - 0.5) * 40;
    speeds[i] = 0.02 + Math.random() * 0.05;
  }

  useFrame(() => {
    if (!geomRef.current) return;
    const posAttribute = geomRef.current.attributes.position as THREE.BufferAttribute;
    
    for(let i=0; i<count; i++) {
      let y = posAttribute.getY(i);
      y -= speeds[i];
      if (y < -10) {
        y = 20;
      }
      posAttribute.setY(i, y);
    }
    posAttribute.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute 
          attach="attributes-position" 
          count={count} 
          array={positions} 
          itemSize={3} 
        />
      </bufferGeometry>
      <pointsMaterial 
        color="#ffffff" 
        size={0.15} 
        transparent 
        opacity={0.6} 
        blending={THREE.AdditiveBlending} 
        depthWrite={false}
      />
    </points>
  );
};

export default Snow;