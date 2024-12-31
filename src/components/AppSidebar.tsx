import { useNavigate, useLocation } from "react-router-dom";
import { Headphones, Compass, Radio, Bookmark, LogIn, LogOut, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSimpleSidebar } from "@/contexts/SidebarContext";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const location = useLocation();
  const { isOpen } = useSimpleSidebar();
  const pathname = location.pathname;
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  // Get user's initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get display name (prefer full name, fallback to email)
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = getInitials(displayName);

  return (
    <div className={cn(
      "fixed h-screen bg-zinc-900 border-r border-zinc-800 p-4",
      className
    )}>
      <div className="flex h-full flex-col gap-2 p-4">
        {/* Logo/Brand */}
        <div className="flex items-center px-4 py-2">
          <Link to="/" className="block w-40 p-2 bg-white rounded-lg transition-transform hover:scale-105">
            <img 
              src="/mic-drop-logo.png" 
              alt="Mic Drop Logo" 
              className="w-full h-auto object-cover scale-125"
            />
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 px-2">
          {[
            { to: "/", label: "Discover", icon: Compass },
            ...(user && profile ? [
              { to: "/feed", label: "Feed", icon: Radio },
              { to: `/profile/${profile.username}`, label: "Profile", icon: User },
              { to: "/saved", label: "Saved", icon: Bookmark },
            ] : [
              { to: "/saved", label: "Saved", icon: Bookmark }
            ])
          ].map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all",
                "hover:bg-zinc-800",
                pathname === to 
                  ? "bg-zinc-800 text-[#23c483] font-medium"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Auth Section */}
        <div className="mt-auto px-2">
          {user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-zinc-800/50">
                <Avatar className="h-9 w-9 border-2 border-yellow-400/20">
                  <AvatarImage
                    src={user.user_metadata.avatar_url}
                    alt={displayName}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-yellow-400/10 text-yellow-400 font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-white truncate">
                    {displayName}
                  </span>
                  <span className="text-xs text-zinc-400 truncate">
                    {user.email}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-zinc-400 hover:text-white hover:bg-zinc-800"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Link to="/signin">
              <Button
                variant="ghost"
                size="lg"
                className="w-full gap-2 bg-zinc-800 hover:bg-zinc-700 text-yellow-400 hover:text-yellow-300 font-medium"
              >
                <LogIn className="h-4 w-4" />
                Get Started
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}