// ... other imports in Index.tsx
import { useState, useEffect, useRef } from "react";
import { SearchBar } from "@/components/SearchBar";
import { PodcastCard } from "@/components/PodcastCard";
import { AudioPlayer } from "@/components/AudioPlayer";
import { podcastApi } from "@/services/podcastApi";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { PageTransition } from "@/components/PageTransition";

interface Podcast {
  id: string;
  title: string;
  author: string;
  description: string;
  imageUrl: string;
  totalEpisodes: number;
  genres: string[];
  episodes?: Episode[];
}

interface Episode {
  id: string;
  title: string;
  description: string;
  date: string;
  duration: string;
  audioUrl: string;
}

interface Genre {
  id: string;
  name: string;
}

const Index = () => {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenreId, setSelectedGenreId] = useState<string | null>(null);
  const [genres, setGenres] = useState<Genre[]>([]);
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchPodcasts = async () => {
      try {
        setLoading(true);
        setError(null);
        setPodcasts([]); // Clear existing podcasts when changing genre
        setPage(1); // Reset page when changing genre
        
        const data = await podcastApi.getBestPodcasts(1, 'us', selectedGenreId);
        setPodcasts(data);
        setHasMore(data.length === 20);
      } catch (err) {
        console.error("Error fetching podcasts:", err);
        setError("Failed to load podcasts");
      } finally {
        setLoading(false);
      }
    };

    const fetchGenres = async () => {
      try {
        const fetchedGenres = await podcastApi.getGenres();
        console.log('Fetched genres:', fetchedGenres);
        setGenres(fetchedGenres);
        console.log('Updated genres state:', genres);
      } catch (err) {
        console.error("Error fetching genres:", err);
      }
    };

    fetchPodcasts();
    fetchGenres();
  }, [selectedGenreId]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isSearching && !loading) {
          setIsLoadingMore(true);
          try {
            const nextPage = page + 1;
            const newData = await podcastApi.getBestPodcasts(nextPage, 'us', selectedGenreId);
            
            if (newData.length > 0) {
              setPodcasts(prev => [...prev, ...newData]);
              setPage(nextPage);
              setHasMore(newData.length === 20);
            } else {
              setHasMore(false);
            }
          } catch (error) {
            console.error('Error loading more podcasts:', error);
            setHasMore(false);
          } finally {
            setIsLoadingMore(false);
          }
        }
      },
      { threshold: 0.1 } // Reduced threshold to trigger earlier
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [page, hasMore, selectedGenreId, isLoadingMore, isSearching, loading]);

  const handleCategorySelect = (genreId: string | null) => {
    setSelectedGenreId(genreId);
  };

  const handlePodcastCardClick = (podcastId: string) => {
    navigate(`/podcast/${podcastId}`);
  };

  const searchedPodcasts = podcasts.filter(
    (podcast) =>
      podcast.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      podcast.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollCategories = (direction: 'left' | 'right') => {
    const container = document.getElementById('categories-container');
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim()) {
      setIsSearching(true);
      try {
        const results = await podcastApi.searchPodcasts(query);
        setPodcasts(results);
        setHasMore(false); // Disable infinite scroll for search results
      } catch (error) {
        console.error('Search error:', error);
        setError('Failed to search podcasts');
      } finally {
        setIsSearching(false);
      }
    } else {
      // If search is cleared, fetch original podcasts
      const data = await podcastApi.getBestPodcasts(1, 'us', selectedGenreId);
      setPodcasts(data);
      setHasMore(true);
      setPage(1);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-3 text-black font-borel">
              Discover Podcasts
            </h1>
            <p className="text-muted-foreground">
              Listen to your favorite shows and discover new ones
            </p>
          </div>

          <div className="mb-8 max-w-md">
            <SearchBar onSearch={handleSearch} />
          </div>

          <div className="mb-8 relative px-14">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm hover:bg-white/90 border border-gray-200 rounded-full w-10 h-10"
              onClick={() => scrollCategories('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div 
              id="categories-container"
              className="flex gap-2 overflow-x-auto scrollbar-hide py-8 my-2"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <Button
                variant={selectedGenreId === null ? "default" : "outline"}
                onClick={() => handleCategorySelect(null)}
                className={`genre-button ${
                  selectedGenreId === null ? 'selected' : ''
                }`}
              >
                All
              </Button>
              {genres.map((genre) => (
                <Button
                  key={genre.id}
                  variant={selectedGenreId === genre.id ? "default" : "outline"}
                  onClick={() => handleCategorySelect(genre.id)}
                  className={`genre-button ${
                    selectedGenreId === genre.id ? 'selected' : ''
                  }`}
                >
                  {genre.name}
                </Button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm hover:bg-white/90 border border-gray-200 rounded-full w-10 h-10"
              onClick={() => scrollCategories('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <section>
            <h2 className="text-2xl font-semibold mb-6">
              {selectedGenreId
                ? `${
                    genres.find((c) => c.id === selectedGenreId)?.name || ""
                  } Podcasts`
                : "Trending Now"}
            </h2>
            {loading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : error ? (
              <div
                className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg"
                role="alert"
              >
                <span className="font-medium">Error:</span> {error}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {searchedPodcasts.map((podcast) => (
                  <PodcastCard
                    key={podcast.id}
                    id={podcast.id.toString()}
                    title={podcast.title}
                    author={podcast.author}
                    imageUrl={podcast.imageUrl}
                    onClick={() => handlePodcastCardClick(podcast.id.toString())}
                  />
                ))}
                {hasMore && <div ref={observerTarget} className="h-20" />}
                {isLoadingMore && (
                  <div className="col-span-full flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* {selectedEpisode && <AudioPlayer episode={selectedEpisode} />} */}
      </div>
    </PageTransition>
  );
};

export default Index;