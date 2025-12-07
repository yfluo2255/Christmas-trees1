import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { TreeState } from '../types';
import Foliage from './Foliage';
import OrnamentSystem from './Ornaments';
import Snow from './Snow';
import Star from './Star';
import PhotoOrnaments from './PhotoOrnaments';

interface ExperienceProps {
  treeState: TreeState;
  photos?: string[];
  onPhotoClick?: (index: number) => void;
}

const Experience: React.FC<ExperienceProps> = ({ treeState, photos = [], onPhotoClick }) => {
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      controls.enablePan = false;
      controls.minDistance = 20;
      controls.maxDistance = 50;
      controls.maxPolarAngle = Math.PI / 1.6;
    }
  }, []);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = treeState === TreeState.FORMED;
      controlsRef.current.autoRotateSpeed = 0.5;
    }
  }, [treeState]);

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: false, toneMappingExposure: 1.2 }}
      shadows
    >
      {/* Camera positioned for grand view */}
      <PerspectiveCamera makeDefault position={[0, 3, 29]} fov={45} />
      
      {/* Pure Black Background */}
      <color attach="background" args={['#000000']} />
      
      {/* Black Fog for seamless fade into void */}
      <fog attach="fog" args={['#000000', 15, 55]} />

      {/* Lighting Setup - High Contrast for Black Background */}
      <ambientLight intensity={0.05} color="#001a0f" />
      
      {/* Key Light - Warm Gold */}
      <spotLight 
        position={[15, 20, 20]} 
        angle={0.25} 
        penumbra={0.4} 
        intensity={150} 
        castShadow 
        shadow-bias={-0.0001}
        color="#fff0d0" 
      />
      
      {/* Rim Light - Cool Blue for outline against black */}
      <spotLight 
        position={[-15, 10, -15]} 
        intensity={80} 
        color="#0044aa" 
        angle={0.5}
        penumbra={1}
      />
      
      {/* Uplight - Warmth from bottom */}
      <pointLight position={[0, -8, 8]} intensity={20} color="#ffaa55" distance={25} />

      {/* Content */}
      <Suspense fallback={null}>
        <group position={[0, -6, 0]}>
            <Foliage treeState={treeState} />
            <OrnamentSystem treeState={treeState} />
            <Star treeState={treeState} />
            <PhotoOrnaments 
                photos={photos} 
                treeState={treeState} 
                onPhotoClick={onPhotoClick || (() => {})}
            />
            
            {/* Subtle shadow on "floor" if needed, though mostly floating in void */}
            <ContactShadows 
              resolution={1024} 
              scale={40} 
              blur={2.5} 
              opacity={0.4} 
              far={10} 
              color="#000000" 
            />
        </group>
        
        <Snow />

        {/* Environment for reflections on ornaments, but kept dark */}
        <Environment preset="city" background={false} blur={0.8} environmentIntensity={0.5} />
      </Suspense>

      <OrbitControls 
        ref={controlsRef}
      />

      {/* Post Processing */}
      <EffectComposer enableNormalPass={false}>
        <Bloom 
          luminanceThreshold={0.7} 
          mipmapBlur 
          intensity={1.0} 
          radius={0.4}
        />
        {/* Subtle Noise for film grain feel */}
        <Noise opacity={0.02} />
        {/* Vignette to focus center */}
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </Canvas>
  );
};

export default Experience;