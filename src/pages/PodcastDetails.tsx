import { useParams } from "react-router-dom";
import { AudioPlayer } from "@/components/AudioPlayer";
import { useState, useEffect } from "react";
import { EpisodesList } from "@/components/EpisodesList";
import { EpisodeComments } from "@/components/EpisodeComments";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { podcastApi } from "@/services/podcastApi";
import { PageTransition } from "@/components/PageTransition";


interface Podcast {
  id: string;
  title: string;
  author: string;
  description: string;
  imageUrl: string;
  totalEpisodes: number;
  subscriberCount: number;
  episodes: Episode[];
  hosts?: Array<{
    name?: string;
    imageUrl?: string;
  }>;
}

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

const commentButtonStyles = `
  .bookmarkBtn {
    width: 130px;
    height: 40px;
    border-radius: 40px;
    border: none;
    background-color: rgb(255, 255, 255);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition-duration: .3s;
    overflow: hidden;
    box-shadow: 10px 10px 10px rgba(0, 0, 0, 0.062);
  }

  .IconContainer {
    width: 30px;
    height: 30px;
    background-color: rgb(103, 74, 228);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    z-index: 2;
    transition-duration: .3s;
  }

  .icon {
    border-radius: 1px;
  }

  .text {
    height: 100%;
    width: 90px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgb(26, 26, 26);
    z-index: 1;
    transition-duration: .3s;
    font-size: 1.04em;
    font-weight: 600;
  }

  .bookmarkBtn:hover .IconContainer {
    width: 120px;
    border-radius: 40px;
    transition-duration: .3s;
  }

  .bookmarkBtn:hover .text {
    transform: translate(10px);
    width: 0;
    font-size: 0;
    transition-duration: .3s;
  }

  .bookmarkBtn:active {
    transform: scale(0.95);
    transition-duration: .3s;
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = commentButtonStyles;
  document.head.appendChild(styleSheet);
}

const PodcastDetails = () => {
  const { id } = useParams();
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<any>(null);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPodcastData = async () => {
      try {
        setLoading(true);
        const podcastData = await podcastApi.getPodcastById(id!);
        const episodesData = await podcastApi.getPodcastEpisodes(id!);
        
        setPodcast({
          ...podcastData,
          episodes: episodesData
        });

        // Load subscriber count from localStorage or use API data
        const savedCount = localStorage.getItem(`podcastSubscribers-${id}`) || podcastData.subscriberCount;
        setSubscriberCount(Number(savedCount));

        // Auto-select the latest episode (first in the list)
        if (episodesData && episodesData.length > 0) {
          const latestEpisode = episodesData[0];
          setSelectedEpisode({
            title: latestEpisode.title,
            podcast: podcastData.title,
            audioUrl: latestEpisode.audioUrl,
            imageUrl: podcastData.imageUrl,
            podcastId: id!
          });
          setSelectedEpisodeId(latestEpisode.id);
        }
      } catch (error) {
        console.error('Full error details:', error);
        setError('Failed to load podcast details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPodcastData();
  }, [id]);

  useEffect(() => {
    const subscriptions = JSON.parse(localStorage.getItem('podcastSubscriptions') || '[]');
    setIsSubscribed(subscriptions.includes(id));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-600">{error}</p>
        <Button 
          onClick={() => navigate(-1)}
          variant="outline"
          className="hover:bg-gray-100 hover:border-gray-900"
        >
          Go Back
        </Button>
      </div>
    );
  }

  if (!podcast) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p>Podcast not found</p>
        <Button 
          onClick={() => navigate(-1)}
          variant="outline"
          className="hover:bg-gray-100 hover:border-gray-900"
        >
          Go Back
        </Button>
      </div>
    );
  }

  const handleEpisodeSelect = (episode: {
    title: string;
    podcast: string;
    audioUrl: string;
    imageUrl: string;
    podcastId: string;
  }) => {
    setSelectedEpisode(episode);
    const episodeId = podcast.episodes.find(ep => ep.audioUrl === episode.audioUrl)?.id;
    setSelectedEpisodeId(episodeId || null);
  };

  const handleSubscribe = () => {
    const newIsSubscribed = !isSubscribed;
    setIsSubscribed(newIsSubscribed);
    
    // Update subscriber count with zero check
    const newCount = Math.max(0, newIsSubscribed ? subscriberCount + 1 : subscriberCount - 1);
    setSubscriberCount(newCount);
    
    // Save to localStorage
    const subscriptions = JSON.parse(localStorage.getItem('podcastSubscriptions') || '[]');
    if (newIsSubscribed) {
      localStorage.setItem('podcastSubscriptions', JSON.stringify([...subscriptions, id]));
    } else {
      localStorage.setItem('podcastSubscriptions', JSON.stringify(subscriptions.filter((subId: string) => subId !== id)));
    }
    localStorage.setItem(`podcastSubscribers-${id}`, String(newCount));

    toast({
      title: newIsSubscribed ? "Subscribed!" : "Unsubscribed!",
      description: newIsSubscribed 
        ? `You are now subscribed to ${podcast.title}`
        : `You have unsubscribed from ${podcast.title}`,
    });
  };

  const handleBackClick = () => {
    navigate('/', { replace: true });
  };

  return (
    <PageTransition>
      <div className="min-h-screen pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <div className="sticky top-8">
                <Button 
                  onClick={handleBackClick} 
                  className="mb-4 gap-2 hover:bg-black hover:text-white transition-colors border border-gray-200 shadow-sm hover:shadow-md"
                  variant="ghost" 
                  size="sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>

                <img
                  src={podcast.imageUrl}
                  alt={podcast.title}
                  className="w-full aspect-square rounded-lg shadow-lg mb-4"
                />
                
                <h1 className="text-2xl font-bold mb-2">{podcast.title}</h1>
                
                {podcast.hosts && podcast.hosts.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-3">
                      {podcast.hosts.map((host, index) => (
                        <div key={index} className="flex items-center gap-3">
                          {host.imageUrl && (
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-indigo-500/20 to-cyan-500/20 rounded-full animate-pulse" />
                              <img
                                src={host.imageUrl}
                                alt={host.name || 'Host'}
                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md relative z-10"
                              />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Host</span>
                            <span className="text-base font-medium">
                              {host.name || 'Anonymous Host'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <p className="text-lg text-muted-foreground mb-4">{podcast.author}</p>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{podcast.totalEpisodes} episodes</p>
                    <span className="text-sm text-muted-foreground">•</span>
                    <p className="text-sm text-muted-foreground">
                      {subscriberCount.toLocaleString()} subscriber{subscriberCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSubscribe}
                    className={`gap-2 ${
                      isSubscribed 
                        ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500 hover:border-rose-600' 
                        : 'text-black hover:bg-gray-100 hover:border-rose-500 hover:text-black'
                    }`}
                  >
                    <Heart 
                      className={`h-4 w-4 ${
                        isSubscribed ? 'fill-current' : ''
                      }`}
                    />
                    {isSubscribed ? 'Subscribed' : 'Subscribe'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-8">
              <EpisodesList 
                episodes={podcast.episodes}
                podcastTitle={podcast.title}
                onEpisodeSelect={handleEpisodeSelect}
                currentlyPlayingId={selectedEpisodeId}
              />
              
              {selectedEpisodeId && (
                <EpisodeComments episodeId={selectedEpisodeId} />
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default PodcastDetails;
