import { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Heart, MessageCircle, MoreHorizontal, Repeat2, Share, ChevronDown, ChevronUp } from 'lucide-react';
import { Post } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/config/supabase';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface PostCardProps {
  post: Post;
  onPostUpdate?: () => void;
  isReply?: boolean;
  level?: number;
}

export function PostCard({ post, onPostUpdate, isReply = false, level = 0 }: PostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(false);
  const { user, profile } = useAuth();

  const hasReplies = post.replies && post.replies.length > 0;
  const maxNestingLevel = 3; // Maximum level of nested replies to show

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

      onPostUpdate?.();
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

      onPostUpdate?.();
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

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !user || !profile) return;
    try {
      const { error } = await supabase
        .from('posts')
        .insert([{
          user_id: user.id,
          content: replyContent.trim(),
          username: profile.username,
          avatar_url: profile.avatar_url || user.user_metadata.avatar_url,
          reply_to: post.id
        }]);

      if (error) throw error;

      setReplyContent('');
      setIsReplyDialogOpen(false);
      onPostUpdate?.();
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

  return (
    <>
      <div className={cn(
        "p-4 border-b border-gray-200 bg-white hover:bg-gray-50 transition-colors",
        isReply && "pl-8 border-l border-l-gray-200",
        level > 0 && "ml-4"
      )}>
        <div className="flex gap-4">
          <Link to={`/profile/${post.username}`} className="hover:opacity-80 transition-opacity">
            <Avatar>
              <img 
                src={post.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.username}`} 
                alt={post.username} 
                className="h-full w-full object-cover"
              />
            </Avatar>
          </Link>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <Link 
                  to={`/profile/${post.username}`}
                  className="inline-flex items-center gap-1 group"
                >
                  <span className="font-medium text-gray-900 group-hover:underline">
                    {post.username}
                  </span>
                  <span className="text-sm text-gray-500">
                    · {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </Link>
                {post.edited && (
                  <span className="text-xs text-gray-500 ml-2">(edited)</span>
                )}
                {post.reply_to && (
                  <span className="text-sm text-gray-500 ml-2">
                    Replying to a post
                  </span>
                )}
              </div>
              {user && user.id === post.user_id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 hover:bg-gray-100 rounded-full">
                      <MoreHorizontal className="h-5 w-5 text-gray-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600"
                      onClick={async () => {
                        if (confirm('Are you sure you want to delete this post?')) {
                          try {
                            const { error } = await supabase
                              .from('posts')
                              .delete()
                              .eq('id', post.id)
                              .eq('user_id', user.id);

                            if (error) throw error;
                            onPostUpdate?.();
                          } catch (error) {
                            console.error('Error deleting post:', error);
                          }
                        }
                      }}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <p className="mt-2 text-gray-900">{post.content}</p>

            <div className="mt-3 flex items-center gap-6 text-gray-500">
              <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
                <DialogTrigger asChild>
                  <button 
                    className="flex items-center gap-1 hover:text-blue-500"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">{post.replies_count || 0}</span>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reply to {post.username}</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    <div className="mb-4">
                      <p className="text-sm text-gray-500">Replying to</p>
                      <p className="text-gray-900">{post.content}</p>
                    </div>
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write your reply..."
                      className="w-full min-h-[100px]"
                    />
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={handleSubmitReply}
                        disabled={!replyContent.trim() || !user}
                      >
                        Reply
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <button 
                className={`flex items-center gap-1 hover:text-green-500 ${
                  post.has_retweeted ? 'text-green-500' : ''
                }`}
                onClick={() => handleRetweet(post.id)}
              >
                <Repeat2 className="h-5 w-5" />
                <span>{post.retweets_count || 0}</span>
              </button>

              <button 
                className={`flex items-center gap-1 hover:text-red-500 ${
                  post.has_liked ? 'text-red-500' : ''
                }`}
                onClick={() => handleLike(post.id)}
              >
                <Heart className={`h-5 w-5 ${post.has_liked ? 'fill-current' : ''}`} />
                <span>{post.likes_count || 0}</span>
              </button>

              <button 
                className="flex items-center gap-1 hover:text-blue-500"
                onClick={() => handleShare(post)}
              >
                <Share className="h-5 w-5" />
              </button>
            </div>

            {hasReplies && level < maxNestingLevel && (
              <div className="mt-3">
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
                >
                  {showReplies ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Hide replies
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {showReplies && hasReplies && level < maxNestingLevel && (
        <div className="replies-container">
          {post.replies.map((reply) => (
            <PostCard
              key={reply.id}
              post={reply}
              onPostUpdate={onPostUpdate}
              isReply={true}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </>
  );
} 