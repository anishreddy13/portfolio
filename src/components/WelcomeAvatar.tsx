"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, X } from "lucide-react";

export default function WelcomeAvatar() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Only show once per session or use localStorage for persistence
    const hasSeenAvatar = sessionStorage.getItem("hasSeenWelcomeAvatar");
    if (hasSeenAvatar) {
      setIsDismissed(true);
    }
  }, []);

  const handleToggleAudio = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
      setShowTooltip(false); // hide tooltip once they interact
    }
    setIsPlaying(!isPlaying);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setIsDismissed(true);
    sessionStorage.setItem("hasSeenWelcomeAvatar", "true");
  };

  if (isDismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end gap-4">
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-slate-900 border border-[rgba(255,255,255,0.1)] shadow-2xl rounded-lg p-3 pr-8 mb-4 max-w-[200px]"
          >
            <button 
              onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}
              className="absolute top-2 right-2 text-slate-500 hover:text-slate-300"
            >
              <X size={14} />
            </button>
            <p className="text-sm font-body text-slate-200">
              👋 Click to hear intro!
            </p>
            {/* Tooltip Arrow pointing right */}
            <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] border-l-slate-900" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar Button */}
      <button 
        onClick={handleToggleAudio}
        className="relative group focus:outline-none"
      >
        {/* Pulsing rings when playing */}
        {isPlaying && (
          <>
            <motion.div 
              animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-full bg-[#C8FF00] pointer-events-none"
            />
            <motion.div 
              animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
              className="absolute inset-0 rounded-full bg-[#C8FF00] pointer-events-none"
            />
          </>
        )}
        
        {/* Dismiss button */}
        <div 
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 bg-slate-800 border border-slate-700 text-slate-400 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white z-10 shadow-lg"
        >
          <X size={12} />
        </div>

        {/* Avatar Image */}
        <div className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-colors duration-300 shadow-2xl ${isPlaying ? 'border-[#C8FF00] shadow-[0_0_20px_rgba(200,255,0,0.4)]' : 'border-slate-700 hover:border-slate-500'}`}>
          {/* Fallback color if image is missing */}
          <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
            <Volume2 size={24} className={isPlaying ? "text-[#C8FF00]" : "text-slate-500"} />
          </div>
          
          <img 
            src="/profile-avatar.jpg" 
            alt="AI Assistant Avatar" 
            className="absolute inset-0 w-full h-full object-cover z-10"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      </button>

      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef}
        src="/intro-audio.mp3"
        onEnded={() => setIsPlaying(false)}
        preload="auto"
      />
    </div>
  );
}
