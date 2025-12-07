import React, { useState } from 'react';
import Experience from './components/Experience';
import Overlay from './components/Overlay';
import GestureController from './components/GestureController';
import { TreeState, GestureType } from './types';

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.CHAOS);
  const [gesture, setGesture] = useState<GestureType>(GestureType.NONE);
  const [photos, setPhotos] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Handle Adding Photos
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newPhotos: string[] = [];
      const files = Array.from(event.target.files);
      
      const remainingSlots = 10 - photos.length;
      const filesToProcess = files.slice(0, remainingSlots);

      let processedCount = 0;

      filesToProcess.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newPhotos.push(e.target.result as string);
          }
          processedCount++;
          
          if (processedCount === filesToProcess.length) {
            setPhotos(prev => [...prev, ...newPhotos]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Handle Replacing a specific photo
  const handleReplacePhoto = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPhotos(prev => {
          const updated = [...prev];
          updated[index] = e.target?.result as string;
          return updated;
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Deleting a specific photo
  const handleDeletePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    if (lightboxIndex === index) setLightboxIndex(null);
  };

  const handleViewPhoto = (index: number) => {
    setLightboxIndex(index);
  };

  return (
    <div className="w-full h-screen relative bg-[#020502]">
      {/* Computer Vision Layer */}
      <GestureController setTreeState={setTreeState} setGesture={setGesture} />
      
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Experience 
          treeState={treeState} 
          photos={photos} 
          onPhotoClick={handleViewPhoto}
        />
      </div>
      
      {/* UI Overlay Layer */}
      <Overlay 
        treeState={treeState} 
        gesture={gesture} 
        photos={photos}
        onAddPhotos={handlePhotoUpload}
        onReplacePhoto={handleReplacePhoto}
        onDeletePhoto={handleDeletePhoto}
        onViewPhoto={handleViewPhoto}
        lightboxIndex={lightboxIndex}
        onCloseLightbox={() => setLightboxIndex(null)}
      />
    </div>
  );
};

export default App;