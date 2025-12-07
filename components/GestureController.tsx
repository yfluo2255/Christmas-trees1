import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { GestureType, TreeState } from '../types';

interface GestureControllerProps {
  setTreeState: (state: TreeState) => void;
  setGesture: (gesture: GestureType) => void;
}

const GestureController: React.FC<GestureControllerProps> = ({ setTreeState, setGesture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
        );
        
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        startWebcam();
        setIsLoaded(true);
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
      }
    };

    initMediaPipe();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const startWebcam = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener("loadeddata", predictWebcam);
      }
    } catch (err) {
      console.error("Webcam error:", err);
    }
  };

  const predictWebcam = () => {
    if (!handLandmarkerRef.current || !videoRef.current) return;

    let startTimeMs = performance.now();
    
    if (videoRef.current.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = videoRef.current.currentTime;
      const results = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);
      
      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        const gesture = analyzeGesture(landmarks);
        setGesture(gesture);
        
        // State Logic:
        // Fist = Assemble (Formed)
        // Open = Explode (Chaos)
        if (gesture === GestureType.CLOSED_FIST) {
          setTreeState(TreeState.FORMED);
        } else if (gesture === GestureType.OPEN_PALM) {
          setTreeState(TreeState.CHAOS);
        }
      } else {
        setGesture(GestureType.NONE);
      }
    }
    
    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  // Simple heuristic for Open vs Closed
  const analyzeGesture = (landmarks: any[]): GestureType => {
    // Wrist is 0
    // Finger tips: 8 (Index), 12 (Middle), 16 (Ring), 20 (Pinky)
    // PIP joints (knuckles): 6, 10, 14, 18
    
    // Calculate reference scale based on palm size (Wrist 0 to Middle MCP 9)
    const wrist = landmarks[0];
    const middleMCP = landmarks[9];
    const palmSize = Math.sqrt(
      Math.pow(wrist.x - middleMCP.x, 2) + 
      Math.pow(wrist.y - middleMCP.y, 2) + 
      Math.pow(wrist.z - middleMCP.z, 2)
    );

    const tips = [8, 12, 16, 20];
    let foldedFingers = 0;

    tips.forEach(tipIdx => {
      const tip = landmarks[tipIdx];
      const distToWrist = Math.sqrt(
        Math.pow(tip.x - wrist.x, 2) + 
        Math.pow(tip.y - wrist.y, 2) + 
        Math.pow(tip.z - wrist.z, 2)
      );
      
      // If tip is close to wrist (relative to palm size), it's folded
      if (distToWrist < palmSize * 1.3) {
        foldedFingers++;
      }
    });

    // If 3 or more fingers are folded, it's a fist
    if (foldedFingers >= 3) return GestureType.CLOSED_FIST;
    
    // Otherwise assume open
    return GestureType.OPEN_PALM;
  };

  return (
    <div className="absolute bottom-8 right-8 z-50 pointer-events-none">
       {/* Small video preview */}
       <div className="relative overflow-hidden rounded-lg border-2 border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.3)] bg-black/50 w-32 h-24">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover opacity-80 transform scale-x-[-1]"
          />
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-[#FFD700] bg-black/80">
              LOADING AI...
            </div>
          )}
       </div>
    </div>
  );
};

export default GestureController;