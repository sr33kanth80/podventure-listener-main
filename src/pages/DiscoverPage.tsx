import { useState, useEffect } from "react";
import { PodcastCard } from "@/components/PodcastCard";
import { podcastApi } from "@/services/podcastApi";
import { Loader2 } from "lucide-react";

interface Podcast {
  id: string;
  title: string;
  author: string;
  description: string;
  imageUrl: string;
  totalEpisodes: number;
}

export default function DiscoverPage() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPodcasts = async () => {
      try {
        setLoading(true);
        const data = await podcastApi.getPopularPodcasts();
        setPodcasts(data);
      } catch (err) {
        console.error('Error fetching podcasts:', err);
        setError('Failed to load podcasts');
      } finally {
        setLoading(false);
      }
    };

    fetchPodcasts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Discover New Podcasts</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {podcasts.map((podcast) => (
          <PodcastCard
            key={podcast.id}
            id={podcast.id}
            title={podcast.title}
            author={podcast.author}
            imageUrl={podcast.imageUrl}
            onClick={() => {}}
          />
        ))}
      </div>
    </div>
  );
}