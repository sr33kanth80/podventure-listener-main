import { createContext, useContext, useState, ReactNode } from 'react';
import { AudioPlayer } from '@/components/AudioPlayer';

interface Episode {
  title: string;
  podcast: string;
  audioUrl: string;
  imageUrl?: string;
  podcastId: string;
}

interface AudioContextType {
  currentEpisode: Episode | null;
  setCurrentEpisode: (episode: Episode | null) => void;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <AudioContext.Provider value={{
      currentEpisode,
      setCurrentEpisode,
      isPlaying,
      setIsPlaying,
    }}>
      {children}
      {currentEpisode && <AudioPlayer />}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
} 