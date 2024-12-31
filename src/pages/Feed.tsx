import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/config/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Heart, Repeat2, Share, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { PostCard } from '@/components/PostCard';
import { Post } from '@/types';

interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
  followers_count: number;
  following_count: number;
  is_following?: boolean;
}

const getInitials = (name: string | undefined) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const formatDate = (date: string) => {
  return format(new Date(date), 'MMM d');
};

export default function Feed() {
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, profile } = useAuth();
  const [replyContent, setReplyContent] = useState('');
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const initials = user ? getInitials(user.user_metadata.full_name || user.email || '') : '';

  useEffect(() => {
    loadPosts();
    loadSuggestedUsers();
  }, [user]);

  const loadPosts = async () => {
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          likes: post_likes(count),
          retweets: post_retweets(count),
          replies: posts!reply_to(
            *,
            likes: post_likes(count),
            retweets: post_retweets(count),
            replies: posts!reply_to(count)
          ),
          parent: posts!reply_to(
            id,
            content,
            username,
            created_at
          )
        `)
        .is('reply_to', null) // Only fetch top-level posts
        .order('created_at', { ascending: false });

      const { data: postsData, error } = await query;
      if (error) throw error;

      // If user is logged in, get their interactions
      if (user && postsData) {
        const postsWithInteractions = await Promise.all(
          postsData.map(async (post) => {
            const [{ data: likeData }, { data: retweetData }] = await Promise.all([
              supabase
                .from('post_likes')
                .select()
                .eq('post_id', post.id)
                .eq('user_id', user.id)
                .single(),
              supabase
                .from('post_retweets')
                .select()
                .eq('post_id', post.id)
                .eq('user_id', user.id)
                .single()
            ]);

            // Process replies recursively
            const repliesWithInteractions = await Promise.all(
              (post.replies || []).map(async (reply: any) => {
                const [{ data: replyLikeData }, { data: replyRetweetData }] = await Promise.all([
                  supabase
                    .from('post_likes')
                    .select()
                    .eq('post_id', reply.id)
                    .eq('user_id', user.id)
                    .single(),
                  supabase
                    .from('post_retweets')
                    .select()
                    .eq('post_id', reply.id)
                    .eq('user_id', user.id)
                    .single()
                ]);

                return {
                  ...reply,
                  likes_count: reply.likes[0]?.count || 0,
                  retweets_count: reply.retweets[0]?.count || 0,
                  replies_count: reply.replies[0]?.count || 0,
                  has_liked: !!replyLikeData,
                  has_retweeted: !!replyRetweetData
                };
              })
            );

            return {
              ...post,
              likes_count: post.likes[0]?.count || 0,
              retweets_count: post.retweets[0]?.count || 0,
              replies_count: post.replies?.length || 0,
              has_liked: !!likeData,
              has_retweeted: !!retweetData,
              parent: post.parent?.[0],
              replies: repliesWithInteractions
            };
          })
        );

        setPosts(postsWithInteractions);
      } else {
        // For non-logged in users, just show the counts
        const postsWithCounts = postsData.map(post => ({
          ...post,
          likes_count: post.likes[0]?.count || 0,
          retweets_count: post.retweets[0]?.count || 0,
          replies_count: post.replies?.length || 0,
          parent: post.parent?.[0],
          replies: post.replies?.map((reply: any) => ({
            ...reply,
            likes_count: reply.likes[0]?.count || 0,
            retweets_count: reply.retweets[0]?.count || 0,
            replies_count: reply.replies[0]?.count || 0,
          }))
        }));

        setPosts(postsWithCounts);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      setError('Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSuggestedUsers = async () => {
    if (!user) return;

    try {
      // Get users you're not following
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user.id)
        .limit(5);

      if (profiles) {
        // Get following status for each user
        const usersWithFollowStatus = await Promise.all(
          profiles.map(async (profile) => {
            const { data: followData } = await supabase
              .from('user_relationships')
              .select('*')
              .eq('follower_id', user.id)
              .eq('following_id', profile.user_id)
              .single();

            return {
              ...profile,
              is_following: !!followData
            };
          })
        );

        setSuggestedUsers(usersWithFollowStatus);
      }
    } catch (error) {
      console.error('Error loading suggested users:', error);
    }
  };

  const handleSubmitPost = async () => {
    if (!newPost.trim() || !user || !profile) return;

    try {
      const { error } = await supabase
        .from('posts')
        .insert([{
          user_id: user.id,
          content: newPost.trim(),
          username: profile.username,
          avatar_url: profile.avatar_url || user.user_metadata.avatar_url
        }]);

      if (error) throw error;

      setNewPost('');
      loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Failed to create post');
    }
  };

  const handleFollow = async (userId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_relationships')
        .insert([{
          follower_id: user.id,
          following_id: userId
        }]);

      if (error) throw error;
      loadSuggestedUsers();
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleUnfollow = async (userId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_relationships')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (error) throw error;
      loadSuggestedUsers();
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    try {
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select()
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert([{ post_id: postId, user_id: user.id }]);
      }

      // Refresh posts to update like count
      loadPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleRetweet = async (postId: string) => {
    if (!user) return;
    try {
      const { data: existingRetweet } = await supabase
        .from('post_retweets')
        .select()
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingRetweet) {
        // Undo retweet
        await supabase
          .from('post_retweets')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        // Retweet
        await supabase
          .from('post_retweets')
          .insert([{ post_id: postId, user_id: user.id }]);
      }

      // Refresh posts to update retweet count
      loadPosts();
    } catch (error) {
      console.error('Error retweeting post:', error);
    }
  };

  const handleShare = async (post: Post) => {
    try {
      await navigator.share({
        title: `Post by ${post.username}`,
        text: post.content,
        url: window.location.href
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh posts after deletion
      loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleEditPost = async (postId: string, newContent: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('posts')
        .update({ 
          content: newContent,
          edited: true,
          last_edited_at: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      loadPosts();
    } catch (error) {
      console.error('Error editing post:', error);
      setError('Failed to edit post');
    }
  };

  const handleSubmitReply = async (postId: string) => {
    if (!replyContent.trim() || !user || !selectedPost) return;
    try {
      const { error } = await supabase
        .from('posts')
        .insert([{
          user_id: user.id,
          content: replyContent.trim(),
          username: profile.username,
          avatar_url: profile.avatar_url || user.user_metadata.avatar_url,
          reply_to: selectedPost.id
        }]);

      if (error) throw error;

      setReplyContent('');
      setIsReplyDialogOpen(false);
      setSelectedPost(null);
      loadPosts();
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

  return (
    <div className="ml-[270px] flex-1 min-h-screen border-x border-gray-200 max-w-[600px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="px-4 py-3">
          <h2 className="text-xl font-bold">Feed</h2>
        </div>
      </div>

      {/* Post Creation */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              className="w-full resize-none border-none bg-transparent text-xl placeholder:text-gray-500 focus:outline-none mb-4"
              placeholder="What's happening?"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <button
                onClick={handleSubmitPost}
                disabled={!newPost.trim() || !user}
                className={`
                  relative text-base uppercase px-10 py-3 rounded-full
                  transition-all duration-200 cursor-pointer
                  border-none font-medium
                  ${!newPost.trim() || !user 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-yellow-400 text-black hover:translate-y-[-3px] hover:shadow-lg hover:shadow-yellow-400/20 active:translate-y-[-1px] active:shadow-md active:shadow-yellow-400/20'
                  }
                  after:content-[""] after:inline-block after:h-full after:w-full
                  after:absolute after:top-0 after:left-0 after:rounded-full
                  after:-z-10 after:transition-all after:duration-400
                  after:bg-yellow-400
                  hover:after:scale-x-[1.4] hover:after:scale-y-[1.6]
                  hover:after:opacity-0
                `}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="divide-y divide-gray-200">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onPostUpdate={loadPosts} />
        ))}
      </div>
    </div>
  );
}
