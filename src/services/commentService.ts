import { supabase } from '@/config/supabase';
import type { Comment, CommentVote } from '@/config/supabase';

export const commentService = {
  async getComments(episodeId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('episode_id', episodeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }

    return data || [];
  },

  async addComment(comment: Omit<Comment, 'id' | 'created_at'>): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert([comment])
      .select()
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      throw error;
    }

    return data;
  },

  async addReply(reply: Omit<Comment, 'id' | 'created_at'>): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert([reply])
      .select()
      .single();

    if (error) {
      console.error('Error adding reply:', error);
      throw error;
    }

    return data;
  },

  async getVotes(userId: string): Promise<CommentVote[]> {
    const { data, error } = await supabase
      .from('comment_votes')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching votes:', error);
      throw error;
    }

    return data || [];
  },

  async vote(vote: Omit<CommentVote, 'created_at'>): Promise<void> {
    // First, remove any existing vote by this user on this comment
    await supabase
      .from('comment_votes')
      .delete()
      .match({ comment_id: vote.comment_id, user_id: vote.user_id });

    // Then add the new vote
    const { error } = await supabase
      .from('comment_votes')
      .insert([vote]);

    if (error) {
      console.error('Error voting:', error);
      throw error;
    }
  },

  async removeVote(commentId: number, userId: string): Promise<void> {
    const { error } = await supabase
      .from('comment_votes')
      .delete()
      .match({ comment_id: commentId, user_id: userId });

    if (error) {
      console.error('Error removing vote:', error);
      throw error;
    }
  }
}; 