export interface Episode {
  id: string;
  title: string;
  description: string;
  date: string;
  duration: string;
  audioUrl: string;
  imageUrl?: string;
  podcastId: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  username: string;
  created_at: string;
  avatar_url?: string;
  edited?: boolean;
  last_edited_at?: string;
  likes_count?: number;
  retweets_count?: number;
  replies_count?: number;
  has_liked?: boolean;
  has_retweeted?: boolean;
  parent?: Post;
  reply_to?: string;
  replies?: Post[];
} 