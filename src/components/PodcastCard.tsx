import { Card } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";

interface PodcastCardProps {
  id: string;
  title: string;
  author: string;
  imageUrl: string;
  onClick: () => void;
}

export function PodcastCard({ id, title, author, imageUrl, onClick }: PodcastCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const subscriptions = JSON.parse(localStorage.getItem('podcastSubscriptions') || '[]');
    setIsSubscribed(subscriptions.includes(id));
  }, [id]);

  return (
    <Card 
      className="group relative overflow-hidden rounded-lg transition-all duration-300 hover:shadow-lg"
      onClick={onClick}
    >
      <AspectRatio ratio={1}>
        <img
          src={imageUrl}
          alt={title}
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-0 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
          <div className="bg-black/85 backdrop-blur-md rounded-lg p-4 border border-white/10">
            <h3 className="font-semibold text-lg text-white truncate mb-1">{title}</h3>
            <p className="text-sm text-white/80 truncate mb-3">{author}</p>
            <Button
              variant="outline"
              size="sm"
              className={`w-full ${
                isSubscribed 
                  ? 'bg-rose-500/80 hover:bg-rose-600/80 text-white border-rose-500/50' 
                  : 'bg-white/20 hover:bg-white/30 text-white border-white/30'
              } backdrop-blur-sm transition-colors`}
              onClick={(e) => {
                e.stopPropagation();
                const newIsSubscribed = !isSubscribed;
                setIsSubscribed(newIsSubscribed);
                
                const subscriptions = JSON.parse(localStorage.getItem('podcastSubscriptions') || '[]');
                if (newIsSubscribed) {
                  localStorage.setItem('podcastSubscriptions', JSON.stringify([...subscriptions, id]));
                } else {
                  localStorage.setItem('podcastSubscriptions', JSON.stringify(subscriptions.filter((subId: string) => subId !== id)));
                }

                toast({
                  title: newIsSubscribed ? "Subscribed!" : "Unsubscribed!",
                  description: newIsSubscribed 
                    ? `You are now subscribed to ${title}`
                    : `You have unsubscribed from ${title}`,
                });
              }}
            >
              <Heart 
                className={`mr-2 h-4 w-4 ${
                  isSubscribed ? 'fill-current' : ''
                }`} 
              />
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </Button>
          </div>
        </div>
      </AspectRatio>
    </Card>
  );
}
