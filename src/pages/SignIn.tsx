import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Headphones } from 'lucide-react';

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn();
    } catch (error) {
      console.error('Error signing in:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign in with Google',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <div className="absolute -inset-1 bg-yellow-400/20 rounded-full blur" />
            <div className="relative h-12 w-12 rounded-full bg-yellow-400 flex items-center justify-center">
              <Headphones className="h-6 w-6 text-black" />
            </div>
          </div>
          <h2 className="text-center text-3xl font-extrabold text-white">
            Welcome to Mic Drop
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-400">
            Join the podcast community
          </p>
        </div>

        <Button
          onClick={handleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-6 border border-zinc-700 rounded-lg shadow-lg bg-zinc-800 text-base font-medium text-white hover:bg-zinc-700 transition-all duration-200"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          {isLoading ? 'Signing in...' : 'Continue with Google'}
        </Button>
      </div>
    </div>
  );
} 