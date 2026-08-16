import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, Volume2, Sparkles } from 'lucide-react';

interface VoiceNotePlayerProps {
  text?: string;
  duration?: string;
  userName?: string;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  text = 'Tap to play my campus voice bio...',
  duration = '0:15',
  userName = 'Student',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 6;
        });
      }, 400);
    } else {
      setProgress(0);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setIsPlaying(!isPlaying);
      }}
      className="p-2.5 rounded-2xl bg-black/60 backdrop-blur-md border border-purple-800/40 cursor-pointer hover:border-purple-500/70 transition-all text-left group"
      id="voice-note-player"
    >
      <div className="flex items-center space-x-2.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsPlaying(!isPlaying);
          }}
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-fuchsia-500 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform"
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-white" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-purple-200 uppercase tracking-wider flex items-center space-x-1">
              <Volume2 className="w-3 h-3 text-purple-400" />
              <span>Voice Bio</span>
            </span>
            <span className="text-[10px] font-mono text-purple-300">
              {isPlaying ? `Playing (${duration})` : duration}
            </span>
          </div>

          {/* Animated Waveform Bars */}
          <div className="flex items-center space-x-1 h-4">
            {[40, 75, 55, 95, 60, 80, 45, 90, 70, 50, 85, 65, 40, 75, 55, 90].map((h, i) => {
              const active = isPlaying && progress > (i / 16) * 100;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-all duration-200 ${
                    active
                      ? 'bg-purple-400 animate-pulse'
                      : isPlaying
                      ? 'bg-purple-600/70'
                      : 'bg-purple-900/50'
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(25, (h * (progress % 40 + 60)) / 100)}%` : `${h * 0.6}%`,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Transcript tooltip / preview */}
      {isPlaying && text && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="text-[11px] text-purple-100 italic mt-2 pt-2 border-t border-purple-800/40 leading-relaxed font-light"
        >
          "{text}"
        </motion.p>
      )}
    </div>
  );
};
