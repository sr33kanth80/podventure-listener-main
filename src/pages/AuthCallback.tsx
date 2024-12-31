import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/config/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    async function checkProfile() {
      if (!user) return;

      try {
        // Check if user already has a profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // If they have a profile (username), send them to home
        // If not, send them to username setup
        if (profile?.username) {
          navigate('/', { replace: true });
        } else {
          navigate('/setup-username', { replace: true });
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        navigate('/setup-username', { replace: true });
      }
    }

    checkProfile();
  }, [user, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Setting up your account...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  );
} 