import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import htmlToMd from 'html-to-md';
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Heart, ThumbsUp, ThumbsDown, MessageSquare, Bookmark } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAudio } from "@/contexts/AudioContext";

interface Episode {
  id: string;
  title: string;
  description: string;
  date: string;
  duration: string;
  audioUrl: string;
  imageUrl?: string;
  podcastId: string;
}

interface LikeStatus {
  likes: number;
  dislikes: number;
  userVote: 'like' | 'dislike' | null;
}

interface EpisodesListProps {
  episodes: Episode[];
  podcastTitle: string;
  onEpisodeSelect: (episode: {
    title: string;
    podcast: string;
    audioUrl: string;
    imageUrl: string;
    podcastId: string;
  }) => void;
  currentlyPlayingId?: string;
}

export const EpisodesList = ({ episodes, podcastTitle, onEpisodeSelect, currentlyPlayingId }: EpisodesListProps) => {
  const [expandedEpisodeId, setExpandedEpisodeId] = useState<string | null>(null);
  const [episodeLikes, setEpisodeLikes] = useState<Record<string, LikeStatus>>({});
  const [savedEpisodes, setSavedEpisodes] = useState<string[]>([]);
  const { toast } = useToast();
  const { setCurrentEpisode, setIsPlaying } = useAudio();

  // Load likes data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('episodeLikes');
    if (saved) {
      setEpisodeLikes(JSON.parse(saved));
    }
  }, []);

  // Load saved episodes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedEpisodes');
    if (saved) {
      setSavedEpisodes(JSON.parse(saved));
    }
  }, []);

  const toggleExpand = (episodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedEpisodeId(expandedEpisodeId === episodeId ? null : episodeId);
  };

  const handleVote = (episode: Episode, voteType: 'like' | 'dislike', e: React.MouseEvent) => {
    e.stopPropagation();
    
    setEpisodeLikes(prev => {
      const currentStatus = prev[episode.id] || { likes: 0, dislikes: 0, userVote: null };
      let newStatus: LikeStatus;

      if (currentStatus.userVote === voteType) {
        // Removing vote
        newStatus = {
          likes: voteType === 'like' ? currentStatus.likes - 1 : currentStatus.likes,
          dislikes: voteType === 'dislike' ? currentStatus.dislikes - 1 : currentStatus.dislikes,
          userVote: null
        };
      } else {
        // Adding or changing vote
        newStatus = {
          likes: voteType === 'like' 
            ? currentStatus.likes + 1 
            : currentStatus.userVote === 'like' 
              ? currentStatus.likes - 1 
              : currentStatus.likes,
          dislikes: voteType === 'dislike' 
            ? currentStatus.dislikes + 1 
            : currentStatus.userVote === 'dislike' 
              ? currentStatus.dislikes - 1 
              : currentStatus.dislikes,
          userVote: voteType
        };
      }

      const updatedLikes = { ...prev, [episode.id]: newStatus };
      localStorage.setItem('episodeLikes', JSON.stringify(updatedLikes));
      return updatedLikes;
    });
  };

  const getLikeRatio = (episodeId: string) => {
    const status = episodeLikes[episodeId];
    if (!status) return 0;
    const total = status.likes + status.dislikes;
    return total === 0 ? 0 : (status.likes / total) * 100;
  };

  const handleSaveEpisode = (episode: Episode, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlySaved = savedEpisodes.includes(episode.id);
    
    const newSavedEpisodes = isCurrentlySaved
      ? savedEpisodes.filter(id => id !== episode.id)
      : [...savedEpisodes, episode.id];
    
    setSavedEpisodes(newSavedEpisodes);
    localStorage.setItem('savedEpisodes', JSON.stringify(newSavedEpisodes));

    console.log('Saved episodes:', newSavedEpisodes);

    toast({
      title: isCurrentlySaved ? "Removed from saved" : "Saved for later",
      description: `${episode.title} has been ${isCurrentlySaved ? 'removed from' : 'added to'} your saved episodes.`,
    });
  };

  const handlePlay = (episode: Episode) => {
    const episodeData = {
      title: episode.title,
      podcast: podcastTitle,
      audioUrl: episode.audioUrl,
      imageUrl: episode.imageUrl,
      podcastId: episode.podcastId
    };
    setCurrentEpisode(episodeData);
    setIsPlaying(true);
    onEpisodeSelect(episodeData);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">All Episodes</h2>
      <ScrollArea className="h-[600px] rounded-md border p-4">
        {episodes.map((episode) => (
          <div
            key={episode.id}
            className={`mb-4 p-4 rounded-lg transition-all duration-300 cursor-pointer border ${
              currentlyPlayingId === episode.id
                ? 'bg-gradient-to-r from-pink-500/10 via-indigo-500/10 to-cyan-500/10 border-indigo-500/50 shadow-lg'
                : 'hover:bg-gray-100 border-transparent hover:border-gray-900'
            }`}
            onClick={() => handlePlay(episode)}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <h3 className="font-medium">{episode.title}</h3>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">{episode.duration}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-transparent"
                  onClick={(e) => handleSaveEpisode(episode, e)}
                >
                  <Bookmark 
                    className={`h-4 w-4 ${
                      savedEpisodes.includes(episode.id)
                        ? 'fill-current text-purple-600'
                        : 'text-gray-500'
                    }`}
                  />
                </Button>

                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-transparent"
                      onClick={(e) => handleVote(episode, 'like', e)}
                    >
                      <ThumbsUp className={`h-4 w-4 ${
                        episodeLikes[episode.id]?.userVote === 'like'
                          ? 'fill-current text-blue-600'
                          : 'text-gray-500'
                      }`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-transparent"
                      onClick={(e) => handleVote(episode, 'dislike', e)}
                    >
                      <ThumbsDown className={`h-4 w-4 ${
                        episodeLikes[episode.id]?.userVote === 'dislike'
                          ? 'fill-current text-blue-600'
                          : 'text-gray-500'
                      }`} />
                    </Button>
                  </div>
                  <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${getLikeRatio(episode.id)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{episode.date}</p>
            
            <div className={`text-sm prose prose-sm max-w-none overflow-hidden transition-all duration-200 ${
              expandedEpisodeId === episode.id ? 'max-h-full' : 'max-h-16'
            }`}>
              <div
                dangerouslySetInnerHTML={{
                  __html: htmlToMd(episode.description)
                }}
              />
            </div>

            <div className="flex items-center justify-between mt-2">
              <Button
                variant="outline"
                size="sm"
                className={`
                  text-xs font-medium
                  ${expandedEpisodeId === episode.id
                    ? 'bg-gray-100 text-gray-700 border-gray-200'
                    : 'bg-white text-gray-600 border-gray-200'
                  }
                  hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300
                  transition-colors duration-200
                `}
                onClick={(e) => toggleExpand(episode.id, e)}
              >
                {expandedEpisodeId === episode.id ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Expand
                  </>
                )}
              </Button>

              <button
                className="play-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlay(episode);
                }}
              >
                <svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="16px">
                  <path d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z" fill="currentColor"></path>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};
