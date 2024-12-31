const SPOTIFY_BASE_URL = 'https://api.spotify.com/v1';
const CLIENT_ID = '7e8347c5d4d245b3ba0b5db5e86f379a';
const CLIENT_SECRET = '3631dc6adc30407fac128d7b6f5e89ea';

let accessToken: string | null = null;

const getSpotifyToken = async () => {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET)
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  accessToken = data.access_token;
  return accessToken;
};

const headers = async () => ({
  'Authorization': `Bearer ${accessToken || await getSpotifyToken()}`,
  'Content-Type': 'application/json'
});

export const podcastApi = {
  getBestPodcasts: async (page: number = 1, region: string = 'us', genreId: string | null = null) => {
    try {
      // Spotify has a limit of 1000 items (50 pages * 20 items)
      if (page > 50) {
        return [];
      }

      const offset = (page - 1) * 20;
      const market = region.toUpperCase();
      
      let query;
      // Build the search query based on genre
      if (genreId && genreId !== 'all_podcasts') {
        // Convert genre_id to search term (e.g., 'true_crime' -> 'true crime')
        const genreTerm = genreId.replace(/_/g, ' ');
        // Use genre as the main search term and add 'podcast' as a type qualifier
        query = `genre:${genreTerm} podcast`;
      } else {
        query = 'podcast';
      }
      
      console.log('Search query:', query, 'Page:', page, 'Offset:', offset);
      
      const response = await fetch(
        `${SPOTIFY_BASE_URL}/search?type=show&market=${market}&limit=20&offset=${offset}&q=${encodeURIComponent(query)}`,
        { headers: await headers() }
      );
      const data = await response.json();
      
      if (data.error) {
        console.error('API error:', data.error);
        return [];
      }
      
      if (!data.shows?.items) {
        console.error('No shows found in response:', data);
        return [];
      }

      // Check if we've reached the end of available results
      if (data.shows.items.length === 0) {
        console.log('No more results available');
        return [];
      }

      // Map the shows
      return data.shows.items.map((show: any) => ({
        id: show.id,
        title: show.name,
        author: show.publisher,
        description: show.description,
        imageUrl: show.images[0].url,
        totalEpisodes: show.total_episodes,
        genres: show.genres || []
      }));
    } catch (error) {
      console.error('Error fetching podcasts:', error);
      return [];
    }
  },

  getGenres: async () => {
    try {
      // Get a sample of popular podcasts to extract genres
      const response = await fetch(
        `${SPOTIFY_BASE_URL}/search?type=show&q=podcast&market=US&limit=50`,
        { headers: await headers() }
      );
      const data = await response.json();
      console.log('Search response:', data);

      if (!data.shows?.items?.length) {
        throw new Error('No podcasts found');
      }

      // Extract all unique genres from the podcasts
      const genres = new Set<string>();
      data.shows.items.forEach((show: any) => {
        if (show.genres && Array.isArray(show.genres)) {
          show.genres.forEach((genre: string) => {
            // Clean up the genre name
            const cleanGenre = genre
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            genres.add(cleanGenre);
          });
        }
      });

      // Convert to array and format
      const genreArray = Array.from(genres)
        .filter(name => name.length > 0)
        .map(name => ({
          id: name.toLowerCase().replace(/\s+/g, '_'),
          name
        }));

      console.log('Extracted genres from podcasts:', genreArray);

      // If we found genres, return them
      if (genreArray.length > 0) {
        // Return genres without the "All Podcasts" option
        return genreArray;
      }

      // Fallback to default categories if no genres found
      return [
        { id: 'news_talk', name: 'News & Talk' },
        { id: 'comedy', name: 'Comedy' },
        { id: 'education', name: 'Education' },
        { id: 'society_culture', name: 'Society & Culture' },
        { id: 'technology', name: 'Technology' },
        { id: 'business', name: 'Business' },
        { id: 'health_wellness', name: 'Health & Wellness' },
        { id: 'entertainment', name: 'Entertainment' },
        { id: 'true_crime', name: 'True Crime' }
      ];
    } catch (error) {
      console.error('Detailed error fetching genres:', error);
      return [
        { id: 'news_talk', name: 'News & Talk' },
        { id: 'comedy', name: 'Comedy' },
        { id: 'education', name: 'Education' },
        { id: 'society_culture', name: 'Society & Culture' },
        { id: 'technology', name: 'Technology' },
        { id: 'business', name: 'Business' },
        { id: 'health_wellness', name: 'Health & Wellness' },
        { id: 'entertainment', name: 'Entertainment' },
        { id: 'true_crime', name: 'True Crime' }
      ];
    }
  },

  searchPodcasts: async (query: string) => {
    const response = await fetch(
      `${SPOTIFY_BASE_URL}/search?type=show&q=${encodeURIComponent(query)}&market=US`,
      { headers: await headers() }
    );
    const data = await response.json();
    
    return data.shows.items.map((show: any) => ({
      id: show.id,
      title: show.name,
      author: show.publisher,
      description: show.description,
      imageUrl: show.images[0].url,
      totalEpisodes: show.total_episodes,
      genres: show.genres
    }));
  },

  getPodcastById: async (id: string) => {
    const response = await fetch(
      `${SPOTIFY_BASE_URL}/shows/${id}?market=US`,
      { headers: await headers() }
    );
    const show = await response.json();
    
    // Create host information from the publisher
    const hosts = [{
      name: show.publisher,
      // Use the show's image as a fallback for the host
      imageUrl: show.images && show.images.length > 0 ? show.images[0].url : undefined
    }];
    
    return {
      id: show.id,
      title: show.name,
      author: show.publisher,
      description: show.description,
      imageUrl: show.images[0].url,
      totalEpisodes: show.total_episodes,
      subscriberCount: 0,
      genreNames: show.genres,
      itunesGenres: [],
      episodes: [],
      hosts
    };
  },

  getPodcastEpisodes: async (podcastId: string) => {
    const [podcastResponse, episodesResponse] = await Promise.all([
      fetch(
        `${SPOTIFY_BASE_URL}/shows/${podcastId}?market=US`,
        { headers: await headers() }
      ),
      fetch(
        `${SPOTIFY_BASE_URL}/shows/${podcastId}/episodes?market=US`,
        { headers: await headers() }
      )
    ]);

    const [podcastData, episodesData] = await Promise.all([
      podcastResponse.json(),
      episodesResponse.json()
    ]);
    
    return episodesData.items.map((episode: any) => ({
      id: episode.id,
      title: episode.name,
      description: episode.description,
      date: new Date(episode.release_date).toLocaleDateString(),
      duration: `${Math.floor(episode.duration_ms / 60000)} min`,
      audioUrl: episode.audio_preview_url,
      imageUrl: podcastData.images?.[0]?.url,
      podcastId
    }));
  },

  getEpisodesByIds: async (episodeIds: string[]) => {
    try {
      // Filter for only Spotify IDs (they have a specific format)
      const spotifyEpisodeIds = episodeIds.filter(id => 
        id.length === 22 && !id.includes('-')
      );

      if (spotifyEpisodeIds.length === 0) return [];

      const response = await fetch(
        `${SPOTIFY_BASE_URL}/episodes?ids=${spotifyEpisodeIds.join(',')}&market=US`,
        { headers: await headers() }
      );
      const data = await response.json();
      
      if (!data.episodes) return [];

      return data.episodes.filter(Boolean).map((episode: any) => ({
        id: episode.id,
        title: episode.name,
        description: episode.description,
        date: new Date(episode.release_date).toLocaleDateString(),
        duration: `${Math.floor(episode.duration_ms / 60000)} min`,
        audioUrl: episode.audio_preview_url,
        imageUrl: episode.images?.[0]?.url || episode.show?.images?.[0]?.url,
        podcastId: episode.show?.id
      }));
    } catch (error) {
      console.error('Error fetching saved episodes:', error);
      return [];
    }
  }
};