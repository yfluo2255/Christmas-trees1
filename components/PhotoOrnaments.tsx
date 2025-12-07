import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { TreeState, COLORS } from '../types';

interface PhotoOrnamentsProps {
  photos: string[]; // Array of blob/data URLs
  treeState: TreeState;
  onPhotoClick: (index: number) => void;
}

const PhotoOrnaments: React.FC<PhotoOrnamentsProps> = ({ photos, treeState, onPhotoClick }) => {
  return (
    <group>
      {photos.map((url, index) => (
        <SinglePhoto 
          key={`photo-${index}-${url.substring(0, 10)}`} 
          url={url} 
          index={index} 
          total={photos.length} 
          treeState={treeState} 
          onClick={() => onPhotoClick(index)}
        />
      ))}
    </group>
  );
};

interface SinglePhotoProps {
  url: string;
  index: number;
  total: number;
  treeState: TreeState;
  onClick: () => void;
}

const SinglePhoto: React.FC<SinglePhotoProps> = ({ url, index, total, treeState, onClick }) => {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useTexture(url);
  const [hovered, setHovered] = useState(false);
  
  // Calculate unique positions for this specific photo
  const { chaosPos, targetPos, targetQuat, scale } = useMemo(() => {
    // 1. Chaos Position (Scattered State)
    // Place them well within the camera's view frustum.
    // Camera is at Z=29. Tree is at Z=0.
    // We place photos between Z=12 and Z=22 so they float in the foreground.
    const cx = (Math.random() - 0.5) * 22; // X Spread: -11 to 11
    const cy = (Math.random() - 0.5) * 14 + 2; // Y Spread: -5 to 9
    const cz = 12 + Math.random() * 10; // Z Depth: 12 to 22 (Foreground)
    const chaos = new THREE.Vector3(cx, cy, cz);

    // 2. Target Position (Formed Tree State)
    const treeHeight = 16.0;
    const baseRadius = 8.0;
    
    // Golden Angle distribution for organic spiral placement on the tree
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    
    // Random height on tree, biased slightly towards bottom for weight
    const y = 2 + (Math.random() * treeHeight * 0.75); 
    const maxR = baseRadius * (1 - (y - 2) / treeHeight);
    const surfaceR = maxR * 0.98; // Slightly outside the foliage
    
    // Spiral angle based on index
    const angle = index * goldenAngle * 7 + Math.random(); 
    
    const tx = surfaceR * Math.cos(angle);
    const ty = y - 6; // Adjust for tree world position
    const tz = surfaceR * Math.sin(angle);
    const target = new THREE.Vector3(tx, ty, tz);

    // Target Orientation: Look OUTWARD from tree center
    // This makes the photo look like a hanging ornament facing the room
    const dummy = new THREE.Object3D();
    dummy.position.copy(target);
    dummy.lookAt(tx * 2, ty, tz * 2); 
    // Add some random z-tilt for natural "hanging" imperfection
    dummy.rotateZ((Math.random() - 0.5) * 0.2);
    const tQuat = dummy.quaternion.clone();

    return { 
      chaosPos: chaos, 
      targetPos: target, 
      targetQuat: tQuat,
      scale: 1.5 + Math.random() * 0.5
    };
  }, [index, total, url]); 

  // Animation State
  const progressRef = useRef(0);
  const floatOffset = useMemo(() => Math.random() * 100, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const targetP = treeState === TreeState.FORMED ? 1.0 : 0.0;
    // Lerp speed
    const lerpSpeed = 1.2 * delta;
    
    progressRef.current = THREE.MathUtils.lerp(progressRef.current, targetP, lerpSpeed);
    const t = progressRef.current;
    
    // Ease out cubic function for smooth arrival
    const ease = 1 - Math.pow(1 - t, 3);

    // 1. Position Interpolation
    groupRef.current.position.lerpVectors(chaosPos, targetPos, ease);
    
    // 2. Rotation Interpolation
    // Calculate "Look At Camera" quaternion for Chaos state
    // This ensures photos always face the user when scattered
    const lookDummy = new THREE.Object3D();
    lookDummy.position.copy(groupRef.current.position);
    lookDummy.lookAt(state.camera.position);
    
    // Add a gentle floating wobble to the chaos rotation
    if (t < 0.9) {
      lookDummy.rotateZ(Math.sin(state.clock.elapsedTime * 0.5 + floatOffset) * 0.1);
      lookDummy.rotateY(Math.cos(state.clock.elapsedTime * 0.3 + floatOffset) * 0.1);
    }
    const cameraQuat = lookDummy.quaternion;
    
    // Spherical interpolate from Camera View (Chaos) to Tree Surface View (Formed)
    groupRef.current.quaternion.slerpQuaternions(cameraQuat, targetQuat, ease);
    
    // 3. Floating Animation
    if (t < 0.95) {
       // Gentle "Zero Gravity" drift in Chaos
       groupRef.current.position.y += Math.sin(state.clock.elapsedTime + floatOffset) * 0.005;
       groupRef.current.position.x += Math.cos(state.clock.elapsedTime * 0.5 + floatOffset) * 0.002;
    } 
    
    // 4. Scale effect (Pop in + Hover)
    const hoverScale = hovered ? 1.2 : 1.0;
    
    // Docking "Pop" - expand slightly right before landing on the tree
    let dockingPop = 1.0;
    if (t > 0.8 && t < 1.0) {
        dockingPop = 1.0 + Math.sin((t - 0.8) * Math.PI * 5) * 0.15; 
    }
    
    // Base scale transitions: slightly larger in chaos to be legible, normal on tree
    const baseScale = THREE.MathUtils.lerp(scale * 1.2, scale, ease);
    const finalScale = baseScale * hoverScale * dockingPop;
    
    groupRef.current.scale.setScalar(finalScale);
  });
  
  return (
    <group 
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
        setHovered(true);
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
        setHovered(false);
      }}
    >
      {/* Gold Frame */}
      <mesh castShadow receiveShadow position={[0, 0, -0.02]}>
        <boxGeometry args={[1.2, 1.5, 0.05]} />
        <meshStandardMaterial 
          color={COLORS.GOLD} 
          metalness={0.9} 
          roughness={0.2}
          emissive={COLORS.GOLD}
          emissiveIntensity={hovered ? 0.5 : 0.2}
        />
      </mesh>
      
      {/* Photo Plane */}
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[1.0, 1.3]} />
        <meshStandardMaterial 
          map={texture} 
          // Use texture as emissive map to make it self-illuminated ("backlit")
          emissiveMap={texture}
          emissive="white"
          emissiveIntensity={0.55} // Brightness boost
          roughness={0.2}
          metalness={0.0}
        />
      </mesh>
      
      {/* Glass/Gloss Layer for luxury feel */}
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[1.0, 1.3]} />
        <meshPhysicalMaterial 
          color="white"
          transparent
          opacity={0.1} // Reduced opacity for clarity
          roughness={0.0}
          metalness={0.9}
          clearcoat={1.0}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

export default PhotoOrnaments;