import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Avatar } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { ArrowBigUp, ArrowBigDown, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import type { Comment, CommentVote } from "@/config/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/config/supabase";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const styleTag = document.createElement('style');
styleTag.setAttribute('id', 'comment-button-styles');
if (!document.getElementById('comment-button-styles')) {
  document.head.appendChild(styleTag);
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
    width: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgb(26, 26, 26);
    z-index: 1;
    transition-duration: .3s;
    font-size: 0.75em !important;
    font-weight: 600;
  }

  .bookmarkBtn:hover .IconContainer {
    width: 120px;
    border-radius: 40px;
    transition-duration: .3s;
  }

  .bookmarkBtn:hover .text {
    transform: translate(30px);
    width: 0;
    font-size: 0;
    opacity: 0;
    transition-duration: .3s;
  }

  .bookmarkBtn:active {
    transform: scale(0.95);
    transition-duration: .3s;
  }
`;

if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('comment-button-styles') as HTMLStyleElement;
  if (existingStyle) {
    existingStyle.textContent = commentButtonStyles;
  }
}

const CommentComponent = ({ 
  comment, 
  onReply, 
  handleVote, 
  commentVotes,
  getVoteScore,
  onDelete,
  onEdit,
  depth = 0
}: { 
  comment: Comment;
  onReply: (parentId: number, content: string) => void;
  handleVote: (commentId: number, voteType: 'up' | 'down') => void;
  commentVotes: Record<number, CommentVote>;
  getVoteScore: (commentId: number) => number;
  onDelete: (commentId: number) => void;
  onEdit: (commentId: number, newContent: string) => void;
  depth?: number;
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(true);
  const { user } = useAuth();

  const isCommentOwner = user?.id === comment.user_id;

  const handleSubmitReply = () => {
    if (!replyContent.trim() || !user) return;
    onReply(comment.id, replyContent);
    setReplyContent("");
    setIsReplying(false);
  };

  const handleSubmitEdit = () => {
    if (!editContent.trim() || !user || !isCommentOwner) return;
    onEdit(comment.id, editContent.trim());
    setIsEditing(false);
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l border-gray-200 pl-4' : ''}`}>
      <div className="flex gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-900">
        <Avatar>
          <img src={comment.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.username}`} alt={comment.username} />
        </Avatar>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">{comment.username}</span>
              {comment.edited && (
                <span className="text-xs text-gray-500">(edited)</span>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSubmitEdit}
                  className="bg-white text-black border hover:bg-black hover:text-white"
                >
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm mb-2">{comment.content}</p>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleVote(comment.id, 'up')}
                className={`p-1 rounded hover:bg-gray-200 ${
                  commentVotes[comment.id]?.vote_type === 'up' ? 'text-green-600' : ''
                }`}
              >
                <ArrowBigUp className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium">{getVoteScore(comment.id)}</span>
              <button
                onClick={() => handleVote(comment.id, 'down')}
                className={`p-1 rounded hover:bg-gray-200 ${
                  commentVotes[comment.id]?.vote_type === 'down' ? 'text-red-600' : ''
                }`}
              >
                <ArrowBigDown className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              {user && (
                <button
                  onClick={() => setIsReplying(!isReplying)}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  <MessageSquare className="h-4 w-4" />
                  Reply
                </button>
              )}
              
              {isCommentOwner && (
                <>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(comment.id)}
                    className="flex items-center gap-1 text-sm text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>

            {comment.replies && comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
              >
                {showReplies ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>

          {isReplying && (
            <div className="mt-4 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSubmitReply}
                  className="bg-white text-black border hover:bg-black hover:text-white"
                >
                  Reply
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsReplying(false);
                    setReplyContent("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => (
                <CommentComponent
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  handleVote={handleVote}
                  commentVotes={commentVotes}
                  getVoteScore={getVoteScore}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function EpisodeComments({ episodeId }: { episodeId: string }) {
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentVotes, setCommentVotes] = useState<Record<number, CommentVote>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadComments = async () => {
      try {
        // Fetch all comments for this episode
        const { data: allComments, error } = await supabase
          .from('comments')
          .select('*')
          .eq('episode_id', episodeId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Organize comments into parent and replies
        const parentComments = allComments?.filter(comment => !comment.parent_id) || [];
        const replies = allComments?.filter(comment => comment.parent_id) || [];

        // Attach replies to their parent comments
        const commentsWithReplies = parentComments.map(parent => ({
          ...parent,
          replies: replies.filter(reply => reply.parent_id === parent.id)
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        }));

        setComments(commentsWithReplies);

        if (user) {
          const { data: votes } = await supabase
            .from('comment_votes')
            .select('*')
            .eq('user_id', user.id);

          const votesMap = (votes || []).reduce((acc, vote) => {
            acc[vote.comment_id] = vote;
            return acc;
          }, {} as Record<number, CommentVote>);
          
          setCommentVotes(votesMap);
        }
      } catch (error) {
        console.error('Error loading comments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadComments();
  }, [episodeId, user]);

  const handleVote = async (commentId: number, voteType: 'up' | 'down') => {
    if (!user) return;

    try {
      const currentVote = commentVotes[commentId];
      
      if (currentVote?.vote_type === voteType) {
        // Remove vote if clicking the same button
        await supabase
          .from('comment_votes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);

        setCommentVotes(prev => {
          const newVotes = { ...prev };
          delete newVotes[commentId];
          return newVotes;
        });
      } else {
        // Add or change vote
        const { error } = await supabase
          .from('comment_votes')
          .upsert({
            comment_id: commentId,
            user_id: user.id,
            vote_type: voteType
          });

        if (error) throw error;

        setCommentVotes(prev => ({
          ...prev,
          [commentId]: {
            comment_id: commentId,
            user_id: user.id,
            vote_type: voteType,
            created_at: new Date().toISOString()
          }
        }));
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const getVoteScore = (commentId: number) => {
    const vote = commentVotes[commentId];
    if (!vote) return 0;
    return vote.vote_type === 'up' ? 1 : -1;
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to leave a comment",
        variant: "destructive"
      });
      return;
    }
    
    if (!newComment.trim()) {
      toast({
        title: "Empty comment",
        description: "Please write something before posting",
        variant: "destructive"
      });
      return;
    }
    
    if (!profile?.username) {
      toast({
        title: "Username required",
        description: "Please set up your username before commenting",
        variant: "destructive"
      });
      navigate('/setup-username');
      return;
    }

    setIsLoading(true);

    try {
      const { data: comment, error } = await supabase
        .from('comments')
        .insert([{
          episode_id: episodeId,
          user_id: user.id,
          content: newComment.trim(),
          username: profile.username,
          avatar_url: profile.avatar_url || user.user_metadata.avatar_url
        }])
        .select()
        .single();

      if (error) throw error;

      setComments(prevComments => [comment, ...prevComments]);
      setNewComment('');
      
      toast({
        title: "Comment posted",
        description: "Your comment has been posted successfully",
      });
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = async (parentId: number, content: string) => {
    if (!content.trim()) return;
    
    if (!user) {
      setError('Please sign in to reply');
      return;
    }
    
    if (!profile?.username) {
      setError('Please set up your username before replying');
      navigate('/setup-username');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data: reply, error } = await supabase
        .from('comments')
        .insert([{
          episode_id: episodeId,
          user_id: user.id,
          content: content.trim(),
          parent_id: parentId,
          username: profile.username,
          avatar_url: profile.avatar_url || user.user_metadata.avatar_url
        }])
        .select()
        .single();

      if (error) throw error;

      setComments(prevComments => {
        return prevComments.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), reply]
            };
          }
          return comment;
        });
      });
    } catch (error) {
      console.error('Error submitting reply:', error);
      setError('Failed to post reply. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!user) return;

    try {
      // First check if the comment exists and belongs to the user
      const { data: comment, error: fetchError } = await supabase
        .from('comments')
        .select('*')
        .eq('id', commentId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;
      if (!comment) throw new Error('Comment not found or unauthorized');

      // Then delete the comment
      const { error: deleteError } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (deleteError) throw deleteError;

      // Remove the comment from state
      setComments(prevComments => {
        return prevComments.map(comment => {
          // If this is the comment to delete
          if (comment.id === commentId) {
            return null;
          }
          // If this comment has replies, filter out the deleted reply
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.filter(reply => reply.id !== commentId)
            };
          }
          return comment;
        }).filter(Boolean) as Comment[];
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('Failed to delete comment. Please try again.');
    }
  };

  const handleEdit = async (commentId: number, newContent: string) => {
    if (!user) return;

    try {
      // First check if the comment exists and belongs to the user
      const { data: comment, error: fetchError } = await supabase
        .from('comments')
        .select('*')
        .eq('id', commentId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;
      if (!comment) throw new Error('Comment not found or unauthorized');

      // Then update the comment
      const { error: updateError } = await supabase
        .from('comments')
        .update({ 
          content: newContent,
          edited: true,
          last_edited_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (updateError) throw updateError;

      // Update the comment in state
      setComments(prevComments => {
        return prevComments.map(comment => {
          // If this is the comment to edit
          if (comment.id === commentId) {
            return {
              ...comment,
              content: newContent,
              edited: true,
              last_edited_at: new Date().toISOString()
            };
          }
          // If this comment has replies, check if we need to edit one
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply => {
                if (reply.id === commentId) {
                  return {
                    ...reply,
                    content: newContent,
                    edited: true,
                    last_edited_at: new Date().toISOString()
                  };
                }
                return reply;
              })
            };
          }
          return comment;
        });
      });
    } catch (error) {
      console.error('Error editing comment:', error);
      setError('Failed to edit comment. Please try again.');
    }
  };

  if (isLoading) {
    return <div>Loading comments...</div>;
  }

  return (
    <div className="mt-8 space-y-4">
      <h3 className="text-xl font-semibold">Comments</h3>
      
      {error && (
        <div className="p-4 text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}
      
      {user ? (
        <div className="space-y-4">
          <Textarea
            placeholder="Share your thoughts about this episode..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px] hover:border-gray-900 focus:border-gray-900"
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSubmitComment}
              className="bookmarkBtn"
            >
              <span className="IconContainer"> 
                <svg fill="white" viewBox="0 0 512 512" height="1em">
                  <path d="M123.6 391.3c12.9-9.4 29.6-11.8 44.6-6.4c26.5 9.6 56.2 15.1 87.8 15.1c124.7 0 208-80.5 208-160s-83.3-160-208-160S48 160.5 48 240c0 32 12.4 62.8 35.7 89.2c8.6 9.7 12.8 22.5 11.8 35.5c-1.4 18.1-5.7 34.7-11.3 49.4c17-7.9 31.1-16.7 39.4-22.7zM21.2 431.9c1.8-2.7 3.5-5.4 5.1-8.1c10-16.6 19.5-38.4 21.4-62.9C17.7 326.8 0 285.1 0 240C0 125.1 114.6 32 256 32s256 93.1 256 208s-114.6 208-256 208c-37.1 0-72.3-6.4-104.1-17.9c-11.9 8.7-31.3 20.6-54.3 30.6c-15.1 6.6-32.3 12.6-50.1 16.1c-.8 .2-1.6 .3-2.4 .5c-4.4 .8-8.7 1.5-13.2 1.9c-.2 0-.5 .1-.7 .1c-5.1 .5-10.2 .8-15.3 .8c-6.5 0-12.3-3.9-14.8-9.9c-2.5-6-1.1-12.8 3.4-17.4c4.1-4.2 7.8-8.7 11.3-13.5c1.7-2.3 3.3-4.6 4.8-6.9c.1-.2 .2-.3 .3-.5z"></path>
                </svg>
              </span>
              <p className="text">Post Comment</p>
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed">
          <p className="text-gray-600">Please sign in to leave a comment</p>
        </div>
      )}

      <ScrollArea className="h-[400px] rounded-md border p-4">
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentComponent
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              handleVote={handleVote}
              commentVotes={commentVotes}
              getVoteScore={getVoteScore}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
