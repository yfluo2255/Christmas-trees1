import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';

interface FoliageProps {
  treeState: TreeState;
  count?: number;
}

const vertexShader = `
  uniform float uTime;
  uniform float uProgress; // 0.0 = Chaos, 1.0 = Formed
  
  attribute vec3 aChaosPos;
  attribute vec3 aTargetPos;
  attribute float aRandom;
  attribute float aBranchTip; 
  
  varying float vAlpha;
  varying vec3 vColor;

  // Cubic Ease Out for smooth arrival
  float easeOutCubic(float x) {
    return 1.0 - pow(1.0 - x, 3.0);
  }

  void main() {
    // Smooth transition logic driven by React state -> uniform
    float t = uProgress;
    float posEase = easeOutCubic(t);
    
    // Interpolate Position: Chaos -> Target
    vec3 pos = mix(aChaosPos, aTargetPos, posEase);
    
    // Wind/Noise Logic
    // Stronger chaotic wind when t=0, gentle breeze when formed (t=1)
    float windStrength = mix(0.2, 0.03, t); 
    float windFreq = 2.0;
    
    pos.x += sin(uTime * windFreq + pos.y * 0.1) * windStrength;
    pos.z += cos(uTime * (windFreq * 0.8) + pos.x * 0.1) * windStrength;
    
    // Subtle breathing pulse when fully formed
    if (t > 0.9) {
       pos += normalize(pos) * sin(uTime + pos.y) * 0.03;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Size attenuation (bigger when close)
    float size = (5.0 * aRandom + 2.0) * (30.0 / -mvPosition.z);
    gl_PointSize = size;
    gl_Position = projectionMatrix * mvPosition;
    
    // Sparkle Alpha
    vAlpha = 0.8 + 0.2 * sin(uTime * 3.0 + aRandom * 100.0);
    
    // Color Logic: Dark interior -> Lighter tips
    vec3 darkGreen = vec3(0.01, 0.15, 0.05); // Deep Shadow Green
    vec3 midGreen = vec3(0.04, 0.35, 0.12);  // Emerald
    vec3 lightGreen = vec3(0.15, 0.55, 0.25); // Fresh Tip
    
    float mixFactor = aBranchTip;
    vec3 finalColor = mix(darkGreen, midGreen, smoothstep(0.0, 0.5, mixFactor));
    finalColor = mix(finalColor, lightGreen, smoothstep(0.5, 1.0, mixFactor));
    
    vColor = finalColor;
  }
`;

const fragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    // Circular particle shape
    vec2 xy = gl_PointCoord.xy - vec2(0.5);
    float dist = length(xy);
    if(dist > 0.5) discard;
    
    // Soft glowy edge
    float glow = 1.0 - smoothstep(0.3, 0.5, dist);
    
    gl_FragColor = vec4(vColor, vAlpha * glow);
  }
`;

const Foliage: React.FC<FoliageProps> = ({ treeState, count = 120000 }) => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  
  // Memoize geometry data generation to run once
  const { chaosPositions, targetPositions, randoms, branchTips } = useMemo(() => {
    const chaos = new Float32Array(count * 3);
    const target = new Float32Array(count * 3);
    const rands = new Float32Array(count);
    const tips = new Float32Array(count);
    
    const treeHeight = 18;
    const baseRadius = 9.0;
    const layers = 24; // More layers for denser look

    for (let i = 0; i < count; i++) {
      // 1. CHAOS POSITION (Exploded State)
      // Random point in a large sphere
      const r = 45 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      chaos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      chaos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      chaos[i * 3 + 2] = r * Math.cos(phi);

      // 2. TARGET POSITION (Formed Tree State)
      // Layered cone structure to simulate pine branches
      const layerIndex = Math.floor(Math.random() * layers);
      const layerProgress = layerIndex / (layers - 1); 
      
      // Height calculation (bottom to top)
      const y = layerProgress * treeHeight - (treeHeight / 2) + 2; 
      
      // Radius at this height (Cone shape)
      const maxR = baseRadius * (1.0 - layerProgress * 0.95);
      
      // Distribute within volume (biased towards surface for density)
      const radiusP = Math.sqrt(Math.random()); 
      const rad = radiusP * maxR;
      const angle = Math.random() * Math.PI * 2;
      
      // Branch droop effect
      const droop = rad * 0.35;
      
      target[i * 3] = rad * Math.cos(angle);
      target[i * 3 + 1] = y - droop + (Math.random() * 0.5); 
      target[i * 3 + 2] = rad * Math.sin(angle);
      
      // 3. Attributes
      rands[i] = Math.random();
      tips[i] = radiusP; // 1.0 = tip of branch, 0.0 = trunk
    }
    
    return { chaosPositions: chaos, targetPositions: target, randoms: rands, branchTips: tips };
  }, [count]);

  // Stable uniforms object
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 }
  }), []);

  useFrame((state, delta) => {
    if (shaderRef.current) {
      // Update time
      shaderRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      
      // Smoothly interpolate progress based on treeState
      // 0 = Chaos, 1 = Formed
      const target = treeState === TreeState.FORMED ? 1.0 : 0.0;
      
      shaderRef.current.uniforms.uProgress.value = THREE.MathUtils.lerp(
        shaderRef.current.uniforms.uProgress.value,
        target,
        delta * 1.5 // Speed of the transition
      );
    }
  });

  return (
    <points>
      <bufferGeometry>
        {/* Important: We set the initial 'position' to chaos so frustum culling works for the large cloud */}
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={chaosPositions} 
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aChaosPos"
          count={count}
          array={chaosPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTargetPos"
          count={count}
          array={targetPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={count}
          array={randoms}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aBranchTip"
          count={count}
          array={branchTips}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
};

export default Foliage;