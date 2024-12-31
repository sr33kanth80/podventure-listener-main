import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kzpngvrpocbacneejzws.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cG5ndnJwb2NiYWNuZWVqendzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0MzQ1NzEsImV4cCI6MjA1MTAxMDU3MX0.2grMXA5s1sf6nuaTZrL-KJwD2w5KFUsDsYJYCMCpZHc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export interface Profile {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
}

export interface Comment {
  id: number;
  episode_id: string;
  user_id: string;
  content: string;
  created_at: string;
  username: string;
  avatar_url?: string;
  parent_id?: number;
  replies?: Comment[];
  edited?: boolean;
  last_edited_at?: string;
}

export interface CommentVote {
  comment_id: number;
  user_id: string;
  vote_type: 'up' | 'down';
  created_at: string;
} 