import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/config/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SetupUsername() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Check if user already has a username
    async function checkExistingUsername() {
      if (!user) {
        navigate('/signin', { replace: true });
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (profile?.username) {
          // User already has a username, redirect to home
          navigate('/', { replace: true });
        }
      } catch (error) {
        // No profile found, continue with username setup
        console.error('Error checking profile:', error);
      }
    }

    checkExistingUsername();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !user) return;

    setIsLoading(true);
    setError('');

    try {
      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.trim())
        .maybeSingle();

      if (existingUser) {
        setError('Username is already taken');
        setIsLoading(false);
        return;
      }

      // Create new profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: user.id,
            username: username.trim(),
            avatar_url: user.user_metadata.avatar_url
          }
        ]);

      if (insertError) throw insertError;

      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error setting username:', error);
      setError('Failed to set username. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Choose your username</h2>
          <p className="mt-2 text-gray-400">This is how other users will see you</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-400"
              required
              minLength={3}
              maxLength={20}
              pattern="^[a-zA-Z0-9_]+$"
              title="Username can only contain letters, numbers, and underscores"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
          >
            {isLoading ? 'Setting up...' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  );
} 