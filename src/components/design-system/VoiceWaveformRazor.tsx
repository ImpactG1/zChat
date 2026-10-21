import React, { useState, useEffect } from 'react';
import { IconVoiceMic } from '@/components/icons/RazorIcons';
import { SoundEngine } from '@/core/feedback/soundEffects';

export interface VoiceWaveformRazorProps {
  durationSeconds?: number;
  barCount?: number;
  isSelf?: boolean;
  style?: React.CSSProperties;
}

export const VoiceWaveformRazor: React.FC<VoiceWaveformRazorProps> = ({
  durationSeconds = 24,
  barCount = 28,
  isSelf = false,
  style,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // Generate deterministic needle heights
  const heights = [
    35, 60, 45, 80, 95, 70, 40, 55, 90, 100, 65, 45, 85, 75, 50, 65, 90, 80, 45, 60, 85, 70, 55, 40, 60, 50, 35, 45,
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 2.5;
        });
      }, (durationSeconds * 1000) / 40);
    }
    return () => clearInterval(timer);
  }, [isPlaying, durationSeconds]);

  const togglePlay = () => {
    SoundEngine.playBladeTick();
    setIsPlaying(!isPlaying);
  };

  const currentSeconds = Math.floor((progress / 100) * durationSeconds);
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 12px',
        background: isSelf ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        borderRadius: '2px',
        maxWidth: '320px',
        ...style,
      }}
    >
      {/* Play / Pause Razor Trigger */}
      <button
        onClick={togglePlay}
        style={{
          width: '32px',
          height: '32px',
          background: isPlaying ? 'var(--gradient-chrome-surface)' : 'var(--void-3)',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          color: isPlaying ? 'var(--text-inverse)' : 'var(--text-white)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
          transition: 'all var(--transition-fast)',
        }}
      >
        {isPlaying ? (
          <span style={{ fontSize: '10px' }}>❚❚</span>
        ) : (
          <span style={{ fontSize: '10px', marginLeft: '2px' }}>▶</span>
        )}
      </button>

      {/* Razor Needle Waveform */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          height: '28px',
          position: 'relative',
          cursor: 'pointer',
        }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const p = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
          setProgress(p);
        }}
      >
        {heights.slice(0, barCount).map((h, i) => {
          const barProgress = (i / barCount) * 100;
          const isPassed = barProgress <= progress;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${h}%`,
                background: isPassed ? '#ffffff' : 'rgba(255, 255, 255, 0.22)',
                boxShadow: isPassed ? '0 0 4px rgba(255, 255, 255, 0.6)' : 'none',
                borderRadius: '0px',
                transition: 'background var(--transition-fast)',
              }}
            />
          );
        })}
      </div>

      {/* Timestamp */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--text-muted)',
          whiteSpace: 'nowrap',
          minWidth: '55px',
          textAlign: 'right',
        }}
      >
        {formatTime(currentSeconds)} / {formatTime(durationSeconds)}
      </div>

      <IconVoiceMic size={13} color="var(--text-muted)" />
    </div>
  );
};
