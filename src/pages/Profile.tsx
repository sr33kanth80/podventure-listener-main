import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/config/supabase';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { ArrowLeft, Camera } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { PostCard } from '@/components/PostCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Post } from '@/types';
import { cn } from '@/lib/utils';

interface ProfileData {
  username: string;
  bio: string;
  avatar_url: string;
  banner_url?: string;
  following_count: number;
  followers_count: number;
  posts_count: number;
  user_id: string;
}

type TabType = 'posts' | 'replies' | 'media' | 'likes';

export default function Profile() {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    bio: '',
    avatar_url: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  const isOwnProfile = user?.id === profileData?.user_id;

  useEffect(() => {
    if (username) {
      loadProfileData();
    }
  }, [username, user]);

  useEffect(() => {
    if (profileData) {
      loadPosts();
    }
  }, [profileData, activeTab]);

  const loadProfileData = async () => {
    try {
      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (profileError) throw profileError;

      // Get following status if user is logged in
      if (user && profile) {
        const { data: followData } = await supabase
          .from('user_relationships')
          .select()
          .eq('follower_id', user.id)
          .eq('following_id', profile.user_id)
          .single();

        setIsFollowing(!!followData);
      }

      // Get counts
      const [followersCount, followingCount, postsCount] = await Promise.all([
        supabase
          .from('user_relationships')
          .select('*', { count: 'exact' })
          .eq('following_id', profile.user_id),
        supabase
          .from('user_relationships')
          .select('*', { count: 'exact' })
          .eq('follower_id', profile.user_id),
        supabase
          .from('posts')
          .select('*', { count: 'exact' })
          .eq('user_id', profile.user_id)
      ]);

      setProfileData({
        ...profile,
        followers_count: followersCount.count || 0,
        following_count: followingCount.count || 0,
        posts_count: postsCount.count || 0
      });

      setEditForm({
        username: profile.username,
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPosts = async () => {
    if (!profileData) return;

    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          likes: post_likes(count),
          retweets: post_retweets(count),
          replies: posts!reply_to(count)
        `)
        .eq('user_id', profileData.user_id)
        .order('created_at', { ascending: false });

      // Filter based on active tab
      switch (activeTab) {
        case 'replies':
          query = query.not('reply_to', 'is', null);
          break;
        case 'media':
          query = query.not('media_url', 'is', null);
          break;
        case 'likes':
          // For likes tab, we need a different query
          const { data: likedPosts } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', profileData.user_id);
          
          if (likedPosts) {
            const postIds = likedPosts.map(like => like.post_id);
            query = query.in('id', postIds);
          }
          break;
        default: // 'posts'
          query = query.is('reply_to', null);
      }

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

            return {
              ...post,
              likes_count: post.likes[0]?.count || 0,
              retweets_count: post.retweets[0]?.count || 0,
              replies_count: post.replies[0]?.count || 0,
              has_liked: !!likeData,
              has_retweeted: !!retweetData
            };
          })
        );

        setPosts(postsWithInteractions);
      } else {
        setPosts(postsData.map(post => ({
          ...post,
          likes_count: post.likes[0]?.count || 0,
          retweets_count: post.retweets[0]?.count || 0,
          replies_count: post.replies[0]?.count || 0
        })));
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const handleFollow = async () => {
    if (!user || !profileData) return;

    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('user_relationships')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profileData.user_id);
      } else {
        // Follow
        await supabase
          .from('user_relationships')
          .insert([{
            follower_id: user.id,
            following_id: profileData.user_id
          }]);
      }

      setIsFollowing(!isFollowing);
      loadProfileData(); // Refresh counts
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  };

  const handleEditProfile = async () => {
    if (!user || !profileData) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: editForm.username,
          bio: editForm.bio,
          avatar_url: editForm.avatar_url
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setIsEditDialogOpen(false);
      loadProfileData();
      
      // If username changed, navigate to new profile URL
      if (editForm.username !== username) {
        navigate(`/${editForm.username}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleImageUpload = async (file: File, type: 'avatar' | 'banner') => {
    if (!user || !profileData) return;

    try {
      setIsUploading(true);

      // Create a unique file name with user ID as folder name for RLS
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return;
      }

      if (!data?.path) {
        console.error('No path returned from upload');
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      // Update profile with new image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          [type === 'avatar' ? 'avatar_url' : 'banner_url']: publicUrl
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return;
      }

      // Update local state
      setProfileData(prev => prev ? {
        ...prev,
        [type === 'avatar' ? 'avatar_url' : 'banner_url']: publicUrl
      } : null);

      // Force reload profile data to ensure we have the latest
      await loadProfileData();

    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="ml-[270px] flex-1 min-h-screen border-x border-gray-200 max-w-[600px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-4 py-2 border-b border-gray-200">
        <div className="flex items-center gap-6">
          <Link to="/" className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="font-bold text-xl">{profileData?.username}</h2>
            <span className="text-sm text-gray-500">{profileData?.posts_count} posts</span>
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <div>
        {/* Banner Image */}
        <div className="relative h-32 bg-gray-200 group">
          {profileData?.banner_url && (
            <img 
              src={profileData.banner_url}
              alt="Profile banner"
              className="w-full h-full object-cover"
            />
          )}
          {isOwnProfile && (
            <>
              <input
                type="file"
                ref={bannerInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'banner');
                }}
              />
              <button
                onClick={() => bannerInputRef.current?.click()}
                disabled={isUploading}
                className={cn(
                  "absolute inset-0 flex items-center justify-center bg-black/50",
                  isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                  "transition-opacity"
                )}
              >
                {isUploading ? (
                  <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </button>
            </>
          )}
        </div>
        
        {/* Profile Info Section */}
        <div className="px-4 pb-4">
          <div className="flex justify-between items-start">
            {/* Avatar */}
            <div className="relative group">
              <Avatar className="w-32 h-32 border-4 border-white -mt-16">
                <img 
                  src={profileData?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} 
                  alt={username} 
                  className="w-full h-full object-cover"
                />
              </Avatar>
              {isOwnProfile && (
                <>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, 'avatar');
                    }}
                  />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploading}
                    className={cn(
                      "absolute inset-0 flex items-center justify-center bg-black/50 rounded-full",
                      isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                      "transition-opacity"
                    )}
                  >
                    {isUploading ? (
                      <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </button>
                </>
              )}
            </div>
            
            {/* Edit Profile / Follow Button */}
            <div className="mt-4">
              {isOwnProfile ? (
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="rounded-full font-bold">
                      Edit profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Username</label>
                        <Input
                          value={editForm.username}
                          onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Bio</label>
                        <Textarea
                          value={editForm.bio}
                          onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Avatar URL</label>
                        <Input
                          value={editForm.avatar_url}
                          onChange={(e) => setEditForm(prev => ({ ...prev, avatar_url: e.target.value }))}
                        />
                      </div>
                      <Button onClick={handleEditProfile}>Save</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button 
                  variant={isFollowing ? "outline" : "default"}
                  className="rounded-full font-bold"
                  onClick={handleFollow}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="mt-4">
            <h2 className="font-bold text-xl">{profileData?.username}</h2>
            <p className="text-gray-500">@{username}</p>
            
            {profileData?.bio && (
              <p className="mt-3 text-gray-900">{profileData.bio}</p>
            )}

            {/* Following/Followers Count */}
            <div className="flex gap-4 mt-3 text-sm">
              <Link to={`/${username}/following`} className="text-gray-500 hover:underline">
                <span className="font-bold text-gray-900">{profileData?.following_count}</span> Following
              </Link>
              <Link to={`/${username}/followers`} className="text-gray-500 hover:underline">
                <span className="font-bold text-gray-900">{profileData?.followers_count}</span> Followers
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            {(['posts', 'replies', 'media', 'likes'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 text-sm font-medium px-4 py-4 border-b-2 hover:bg-gray-50 hover:text-gray-700 ${
                  activeTab === tab
                    ? 'text-blue-500 border-blue-500'
                    : 'text-gray-500 border-transparent'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Posts Feed */}
        <div className="divide-y divide-gray-200">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onPostUpdate={loadPosts} />
          ))}
        </div>
      </div>
    </div>
  );
} 