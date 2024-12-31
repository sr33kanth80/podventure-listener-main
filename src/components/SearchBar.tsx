import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { podcastApi } from "@/services/podcastApi";

interface SearchSuggestion {
  id: string;
  title: string;
  author: string;
  imageUrl: string;
}

export function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();

  const fetchSuggestions = async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    
    try {
      const results = await podcastApi.searchPodcasts(query);
      setSuggestions(results.slice(0, 5)); // Show top 5 suggestions
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Show suggestions after 300ms of typing
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  return (
    <div className="relative w-full">
      <div className={cn(
        "relative group transition-all duration-300",
        isFocused ? "scale-[1.01]" : ""
      )}>
        <Input
          className={cn(
            "pl-12 pr-4 h-14 bg-white/80 backdrop-blur-sm",
            "border-2 border-gray-200/20",
            "rounded-2xl shadow-lg",
            "text-lg placeholder:text-gray-400",
            "transition-all duration-300",
            "hover:border-purple-500/20 hover:bg-white/90",
            "focus:border-purple-500/30 focus:bg-white",
            "focus:ring-4 focus:ring-purple-500/10",
          )}
          placeholder="Search podcasts..."
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            setShowSuggestions(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            // Delay hiding suggestions to allow clicking them
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSearch(inputValue);
              setShowSuggestions(false);
            }
          }}
        />
        <Search className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5",
          "text-gray-400 transition-colors duration-300",
          isFocused ? "text-purple-500" : ""
        )} />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute w-full mt-2 py-2 bg-white rounded-lg shadow-xl border border-gray-200/50 backdrop-blur-lg z-50">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
              onClick={() => {
                setInputValue(suggestion.title);
                onSearch(suggestion.title);
                setShowSuggestions(false);
              }}
            >
              <img 
                src={suggestion.imageUrl} 
                alt={suggestion.title}
                className="w-10 h-10 rounded-md object-cover"
              />
              <div>
                <p className="font-medium text-sm">{suggestion.title}</p>
                <p className="text-xs text-gray-500">{suggestion.author}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}