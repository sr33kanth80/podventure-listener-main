import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Feed from "./pages/Feed";
import Saved from "./pages/Saved";
import PodcastDetails from "./pages/PodcastDetails";
import AuthCallback from "./pages/AuthCallback";
import { AppSidebar } from "./components/AppSidebar";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppRoutes() {
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="/podcast/:id" element={<PodcastDetails />} />
            <Route path="/callback" element={<AuthCallback />} />
          </Routes>
        </main>
      </div>
    </TooltipProvider>
  );
} 