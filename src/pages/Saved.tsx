import { useState, useEffect } from "react";
import { EpisodesList } from "@/components/EpisodesList";
import { podcastApi } from "@/services/podcastApi";
import { Loader2 } from "lucide-react";
import type { Episode } from "@/types";
import { PageTransition } from "@/components/PageTransition";
import { Bookmark, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Saved = () => {
  const [savedEpisodes, setSavedEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSavedEpisodes = async () => {
      try {
        setLoading(true);
        const savedIds = JSON.parse(localStorage.getItem('savedEpisodes') || '[]');
        console.log('Fetching saved episodes with IDs:', savedIds);
        const episodes = await podcastApi.getEpisodesByIds(savedIds);
        console.log('Fetched episodes:', episodes);
        setSavedEpisodes(episodes);
      } catch (error) {
        console.error('Error fetching saved episodes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedEpisodes();
  }, []);

  return (
    <PageTransition>
      <div className="min-h-screen pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="mb-8 bg-zinc-900 p-8 rounded-lg border border-zinc-800 relative overflow-hidden">
            {/* Animated gradient backgrounds */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-indigo-500/20 to-cyan-500/20 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-pink-500/20 to-indigo-500/20 animate-pulse delay-700" />
            
            <div className="relative">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-yellow-400/5 rounded-full blur-2xl" />
              
              <h1 className="text-4xl font-bold mb-3 text-white font-borel">
                Saved Episodes
              </h1>
              <p className="text-zinc-400 text-lg">
                Your personal collection of episodes for later listening
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                  <Bookmark className="h-4 w-4 text-yellow-400" />
                  <span className="text-zinc-300">{savedEpisodes.length} saved</span>
                </div>
                <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <span className="text-zinc-300">
                    {Math.floor(savedEpisodes.reduce((acc, ep) => 
                      acc + parseInt(ep.duration), 0) / 60)} hours
                  </span>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : savedEpisodes.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <EpisodesList 
                episodes={savedEpisodes}
                podcastTitle="Saved Episodes"
                onEpisodeSelect={(episode) => {
                  // Handle episode selection
                }}
              />
            </div>
          ) : (
            <div className="relative text-center py-20 px-4 rounded-2xl border-2 border-dashed border-zinc-200">
              {/* Decorative background elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -right-1/2 w-[500px] h-[500px] bg-gradient-to-b from-yellow-100/30 via-yellow-200/10 to-transparent rounded-full blur-3xl" />
                <div className="absolute -bottom-1/2 -left-1/2 w-[500px] h-[500px] bg-gradient-to-t from-zinc-100/30 via-zinc-200/10 to-transparent rounded-full blur-3xl" />
              </div>
              
              {/* Content */}
              <div className="relative">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-white shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/50 via-indigo-500/50 to-cyan-500/50 animate-pulse" />
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/50 via-pink-500/50 to-indigo-500/50 animate-pulse delay-700" />
                  <div className="relative z-10">
                    <Bookmark className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-zinc-900 mb-3">
                  Your Library Awaits
                </h3>
                <p className="text-zinc-600 text-lg max-w-md mx-auto mb-8">
                  Start saving episodes from your favorite podcasts to build your personal collection
                </p>
                
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  size="lg"
                  className="bg-gradient-to-r from-pink-500/80 via-indigo-500/80 to-cyan-500/80 text-white border-0 hover:from-pink-600/80 hover:via-indigo-600/80 hover:to-cyan-600/80 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Browse Podcasts
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Saved;