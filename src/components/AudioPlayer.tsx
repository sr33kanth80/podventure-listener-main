import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAudio } from "@/contexts/AudioContext";
import { useNavigate } from "react-router-dom";

const playerStyles = `
  .card {
    --main-color: #fff;
    --bg-color: #090909;
    --sub-main-color: #B9B9B9;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    width: 360px;
    background: var(--bg-color);
    border-radius: 20px;
    padding: 30px;
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 50;
    transition: all 0.3s ease;
  }

  .card.minimized {
    width: 280px;
    padding: 18px;
  }

  .card__menu {
    cursor: pointer;
    position: absolute;
    top: 10px;
    right: 10px;
  }

  .card__minimize {
    cursor: pointer;
    position: absolute;
    top: 10px;
    right: 40px;
  }

  .card__img {
    height: 224px;
    width: 224px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-inline: auto;
    background: #131313;
    border-radius: 100%;
    margin-bottom: 20px;
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .minimized .card__img {
    height: 48px;
    width: 48px;
    margin-bottom: 0;
    margin-inline: 0;
  }

  .card__img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .card__title {
    font-weight: 500;
    font-size: 24px;
    color: var(--main-color);
    text-align: center;
    margin-bottom: 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: all 0.3s ease;
  }

  .minimized .card__title {
    font-size: 16px;
    text-align: left;
    margin-bottom: 5px;
  }

  .card__subtitle {
    font-weight: 400;
    font-size: 16px;
    color: var(--sub-main-color);
    text-align: center;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 20px;
    transition: all 0.3s ease;
  }

  .minimized .card__subtitle {
    font-size: 14px;
    text-align: left;
    margin-bottom: 10px;
  }

  .card__content {
    transition: all 0.3s ease;
  }

  .minimized .card__content {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .minimized .card__info {
    flex: 1;
    min-width: 0;
  }

  .card__wrapper {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-top: 20px;
  }

  .minimized .card__wrapper {
    margin-top: 10px;
  }

  .card__time {
    font-weight: 400;
    font-size: 12px;
    color: var(--main-color);
  }

  .minimized .card__time {
    display: none;
  }

  .card__timeline {
    width: 100%;
    height: 4px;
    display: flex;
    align-items: center;
    cursor: pointer;
    background: #424242;
    border-radius: 100px;
    position: relative;
  }

  .card__timeline-progress {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background-color: #fff;
    border-radius: 100px;
    transition: width 0.1s linear;
  }

  .card__controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin-top: 20px;
  }

  .minimized .card__controls {
    margin-top: 0;
  }

  .card__btn {
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--main-color);
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  }

  .minimized .card__btn {
    width: 28px;
    height: 28px;
  }

  .card__btn:hover {
    transform: scale(1.1);
  }

  .card__btn-play {
    width: 60px;
    height: 60px;
    background: var(--main-color);
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--bg-color);
  }

  .minimized .card__btn-play {
    width: 32px;
    height: 32px;
  }

  .minimized .card__btn svg {
    width: 18px;
    height: 18px;
  }

  .minimized .card__btn-play svg {
    width: 20px;
    height: 20px;
  }

  .volume-control {
    position: absolute;
    bottom: 100%;
    right: 20px;
    background: var(--bg-color);
    padding: 10px;
    border-radius: 10px;
    display: none;
  }

  .volume-control.visible {
    display: block;
  }

  .volume-slider {
    width: 100px;
    height: 4px;
    background: #424242;
    border-radius: 100px;
    position: relative;
  }
`;

if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.setAttribute('id', 'audio-player-styles');
  if (!document.getElementById('audio-player-styles')) {
    styleTag.textContent = playerStyles;
    document.head.appendChild(styleTag);
  }
}

export function AudioPlayer() {
  const { currentEpisode, setCurrentEpisode, isPlaying, setIsPlaying } = useAudio();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play();
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      const currentProgress = (audio.currentTime / audio.duration) * 100;
      setProgress(currentProgress);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentEpisode, isPlaying]);

  const handlePrevious = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleNext = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = audioRef.current.duration;
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleProgressChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      const newTime = (percentage / 100) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setProgress(percentage);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentEpisode) return null;

  return (
    <div className={`card ${isMinimized ? 'minimized' : ''}`}>
      <button 
        className="card__minimize"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        {isMinimized ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-white/80 hover:text-white">
            <path d="m3 8 4-4 4 4" />
            <path d="M7 4v16" />
            <path d="m21 16-4 4-4-4" />
            <path d="M17 4v16" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-white/80 hover:text-white">
            <path d="m3 16 4 4 4-4" />
            <path d="M7 20V4" />
            <path d="m21 8-4-4-4 4" />
            <path d="M17 20V4" />
          </svg>
        )}
      </button>

      <button 
        className="card__menu"
        onClick={() => setCurrentEpisode(null)}
      >
        <X className="h-6 w-6 text-white/80 hover:text-white" />
      </button>

      <div className="card__content">
        <div className="card__img">
          {currentEpisode.imageUrl ? (
            <img 
              src={currentEpisode.imageUrl} 
              alt={currentEpisode.title}
            />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          )}
        </div>

        <div className="card__info">
          <div className="card__title">{currentEpisode.title}</div>
          <div 
            className="card__subtitle hover:text-white cursor-pointer" 
            onClick={() => navigate(`/podcast/${currentEpisode.podcastId}`)}
          >
            {currentEpisode.podcast}
          </div>
        </div>
      </div>

      <div className="card__wrapper">
        <div className="card__time">{formatTime(audioRef.current?.currentTime || 0)}</div>
        <div 
          className="card__timeline"
          onClick={handleProgressChange}
        >
          <div 
            className="card__timeline-progress"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="card__time">-{formatTime((duration - (audioRef.current?.currentTime || 0)) || 0)}</div>
      </div>

      <audio ref={audioRef} src={currentEpisode.audioUrl} />

      <div className="card__controls">
        <button className="card__btn" onClick={handlePrevious}>
          <SkipBack className="h-6 w-6" />
        </button>

        <button className="card__btn card__btn-play" onClick={togglePlay}>
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6" />
          )}
        </button>

        <button className="card__btn" onClick={handleNext}>
          <SkipForward className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
