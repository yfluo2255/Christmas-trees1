import React, { useRef } from 'react';
import { TreeState, GestureType } from '../types';

interface OverlayProps {
  treeState: TreeState;
  gesture: GestureType;
  photos: string[];
  onAddPhotos: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReplacePhoto: (index: number, file: File) => void;
  onDeletePhoto: (index: number) => void;
  onViewPhoto: (index: number) => void;
  lightboxIndex: number | null;
  onCloseLightbox: () => void;
}

const Overlay: React.FC<OverlayProps> = ({ 
  treeState, 
  gesture, 
  photos, 
  onAddPhotos,
  onReplacePhoto,
  onDeletePhoto,
  onViewPhoto,
  lightboxIndex,
  onCloseLightbox
}) => {
  const addFileInputRef = useRef<HTMLInputElement>(null);

  // Helper for replacement input
  const triggerReplace = (index: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      if (e.target.files && e.target.files[0]) {
        onReplacePhoto(index, e.target.files[0]);
      }
    };
    input.click();
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between h-full">
      {/* Header */}
      <header className="flex flex-col items-center w-full text-center mt-8 p-4">
        <h1 className="font-script text-6xl md:text-8xl text-white leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transform -rotate-2">
          Merry Christmas
        </h1>
        <h2 className="text-[#FFD700] tracking-[0.4em] text-[10px] md:text-xs font-serif uppercase mt-4 opacity-80">
          Grand Luxury Collection
        </h2>
      </header>

      {/* Center - Gesture Feedback */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-full z-0">
        <div className={`transition-all duration-700 ease-out transform ${gesture !== GestureType.NONE ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="inline-block text-[#FFD700] border-y border-[#FFD700]/30 py-2 px-8 bg-black/20 backdrop-blur-sm uppercase tracking-[0.3em] text-xs font-light">
                {gesture === GestureType.CLOSED_FIST ? 'Forming Tree' : 'Releasing Chaos'}
            </div>
        </div>
      </div>

      {/* Right Side - Photo Manager Bar */}
      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 flex flex-col items-end gap-3 pointer-events-auto max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        <div className="text-[#FFD700] text-[10px] uppercase tracking-widest font-serif mb-2 border-b border-[#FFD700]/30 pb-1 w-full text-right">
            Memories ({photos.length}/10)
        </div>
        
        {/* Photo List */}
        {photos.map((photo, index) => (
          <div key={index} className="group relative w-16 h-16 rounded-lg border border-[#FFD700]/30 bg-black/40 backdrop-blur-md transition-all hover:scale-105 hover:border-[#FFD700]">
            <img 
              src={photo} 
              alt={`Memory ${index + 1}`} 
              className="w-full h-full object-cover rounded-lg cursor-pointer opacity-80 group-hover:opacity-100"
              onClick={() => onViewPhoto(index)}
            />
            {/* Actions on Hover */}
            <div className="absolute -left-10 top-0 bottom-0 flex flex-col justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               {/* Replace */}
               <button 
                 onClick={() => triggerReplace(index)}
                 className="w-6 h-6 rounded-full bg-white/10 hover:bg-[#FFD700] flex items-center justify-center transition-colors"
                 title="Replace"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-white hover:text-black">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                 </svg>
               </button>
               {/* Delete */}
               <button 
                 onClick={() => onDeletePhoto(index)}
                 className="w-6 h-6 rounded-full bg-white/10 hover:bg-red-500 flex items-center justify-center transition-colors"
                 title="Delete"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                 </svg>
               </button>
            </div>
          </div>
        ))}

        {/* Add Button */}
        {photos.length < 10 && (
          <button 
            onClick={() => addFileInputRef.current?.click()}
            className="w-16 h-16 rounded-lg border border-dashed border-[#FFD700]/50 bg-black/20 flex flex-col items-center justify-center gap-1 hover:bg-[#FFD700]/10 transition-colors"
          >
            <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                ref={addFileInputRef} 
                onChange={onAddPhotos}
            />
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#FFD700" className="w-6 h-6 opacity-70">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="text-[8px] text-[#FFD700] uppercase tracking-wider">Add</span>
          </button>
        )}
      </div>

      {/* Bottom - Footer */}
      <div className="flex flex-row justify-between items-end p-8 text-white/50 pointer-events-none">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] tracking-widest font-serif opacity-50">A BEAUTIFUL CHRISTMAS TREE</p>
          <p className="text-[10px] tracking-widest font-serif opacity-50">MADE BY SOUTHPL</p>
        </div>
        
        <div className="text-right flex flex-col items-end">
           <div className="flex items-center gap-2 mb-2">
             <span className={`w-2 h-2 rounded-full ${treeState === TreeState.FORMED ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'}`}></span>
             <span className="text-[10px] tracking-widest uppercase font-bold text-[#FFD700]">
               {treeState === TreeState.FORMED ? 'LOCKED' : 'DRIFTING'}
             </span>
           </div>
           <span className="text-5xl font-serif text-white opacity-90 leading-none">
             {treeState === TreeState.FORMED ? '100' : '0'}%
           </span>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div 
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-8 pointer-events-auto animate-fade-in"
            onClick={onCloseLightbox}
        >
            <div className="relative max-w-4xl max-h-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
                <img 
                    src={photos[lightboxIndex]} 
                    alt="Memory" 
                    className="max-h-[80vh] w-auto border-4 border-[#FFD700] shadow-[0_0_50px_rgba(255,215,0,0.2)] rounded-sm"
                />
                
                <button 
                    onClick={onCloseLightbox}
                    className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors uppercase tracking-widest text-xs"
                >
                    Close [ESC]
                </button>

                <div className="flex gap-4 mt-8">
                     <button 
                        onClick={() => triggerReplace(lightboxIndex)}
                        className="px-6 py-2 border border-[#FFD700]/30 hover:bg-[#FFD700]/10 text-[#FFD700] text-xs uppercase tracking-widest transition-colors"
                     >
                        Replace
                     </button>
                     <button 
                        onClick={() => { onDeletePhoto(lightboxIndex); }}
                        className="px-6 py-2 border border-red-500/30 hover:bg-red-500/10 text-red-400 text-xs uppercase tracking-widest transition-colors"
                     >
                        Delete
                     </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Overlay;