import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/config/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ProfileSettings() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    avatar_url: '',
    banner_url: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
        banner_url: profile.banner_url || ''
      });
    }
  }, [profile]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    try {
      const file = event.target.files?.[0];
      if (!file || !user) return;

      setIsLoading(true);

      // 1. Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${type}s/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // 2. Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      // 3. Update the profile in the database
      const updateData = {} as any;
      updateData[type === 'avatar' ? 'avatar_url' : 'banner_url'] = publicUrl;

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // 4. Update local state
      setFormData(prev => ({
        ...prev,
        [type === 'avatar' ? 'avatar_url' : 'banner_url']: publicUrl
      }));

      // 5. Refresh the profile in context to update UI
      await refreshProfile();

      toast.success(`${type === 'avatar' ? 'Profile picture' : 'Banner'} updated successfully`);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(`Failed to upload ${type === 'avatar' ? 'profile picture' : 'banner'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    try {
      setIsLoading(true);

      // Create the update object with only defined values
      const updateData = {
        username: formData.username
      } as any;

      // Only add fields if they have values
      if (formData.bio) updateData.bio = formData.bio;
      if (formData.avatar_url) updateData.avatar_url = formData.avatar_url;
      if (formData.banner_url) updateData.banner_url = formData.banner_url;

      // Update the profile in the database
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // Refresh the profile in context to update UI
      await refreshProfile();
      
      // Show success message
      toast.success('Profile updated successfully');
      
      // Navigate to profile page
      navigate(`/profile/${formData.username}`);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !profile) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <p>Please sign in to access profile settings</p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label>Username</Label>
            <Input
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Your username"
              required
            />
          </div>

          <div>
            <Label>Bio</Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell us about yourself"
              className="h-24"
            />
          </div>

          <div>
            <Label>Profile Picture</Label>
            <div className="flex items-center gap-4">
              <img
                src={formData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover"
              />
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'avatar')}
              />
            </div>
          </div>

          <div>
            <Label>Banner Image</Label>
            <div className="space-y-2">
              {formData.banner_url && (
                <img
                  src={formData.banner_url}
                  alt="Banner"
                  className="w-full h-32 object-cover rounded-lg"
                />
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'banner')}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/profile/${profile.username}`)}
          >
            Back to Profile
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-black text-white hover:bg-gray-800"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
} 