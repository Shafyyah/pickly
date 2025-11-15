import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChefHat, Sparkles, Search, LogOut } from "lucide-react";
import { toast } from "sonner";
import wallpaper from "@/assets/wallpaper.png";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  isQuestion?: boolean;
}

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [showChat, setShowChat] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/login");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleUniversalSearch = async () => {
    if (!searchQuery.trim()) return;
    
    const userMessage: ChatMessage = { role: "user", content: searchQuery };
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setShowChat(true);
    setSearchQuery("");
    setSearching(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("universal-search", {
        body: { 
          query: searchQuery, 
          userId: user.id,
          conversationHistory: chatHistory 
        },
      });

      if (error) throw error;
      
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.response,
        isQuestion: data.needsMoreInfo
      };
      
      setChatHistory([...newHistory, assistantMessage]);
      
      if (!data.needsMoreInfo) {
        toast.success("Decision made!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process search");
      setChatHistory(chatHistory);
    }
    setSearching(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 animate-slow-pan">
        <img 
          src={wallpaper} 
          alt="" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold text-white">
            Pickly
          </h1>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="max-w-2xl mx-auto space-y-8">
          {/* Universal Search Bar */}
          <div className="bg-card/90 backdrop-blur-md rounded-2xl p-6 border border-white/20" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h2 className="text-2xl font-semibold mb-4">What decision do you need help with?</h2>
            <div className="flex gap-3">
              <Input
                placeholder="e.g., Should I go out tonight or stay in?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUniversalSearch()}
                className="flex-1"
              />
              <Button onClick={handleUniversalSearch} disabled={searching || !searchQuery.trim()}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {/* Chat History */}
          {showChat && (
            <div className="bg-card/90 backdrop-blur-md rounded-2xl p-6 space-y-4 border border-white/20" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {chatHistory.map((message, i) => (
                  <div key={i} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.role === 'assistant' && (
                      <Sparkles className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                    )}
                    <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block p-4 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <p className="whitespace-pre-line">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-3 pt-4 border-t">
                <Input
                  placeholder="Your response..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUniversalSearch()}
                  disabled={searching}
                  className="flex-1"
                />
                <Button onClick={handleUniversalSearch} disabled={searching || !searchQuery.trim()}>
                  {searching ? "..." : "Send"}
                </Button>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setChatHistory([]);
                  setShowChat(false);
                  setSearchQuery("");
                }}
                className="w-full"
              >
                Start New Decision
              </Button>
            </div>
          )}

          {/* Main Feature Buttons */}
          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => navigate("/dinner")}
              className="group bg-card/90 backdrop-blur-md rounded-2xl p-8 text-left transition-all hover:scale-105 border border-white/20"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                  <ChefHat className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-2xl font-semibold">What should I cook tonight?</h3>
              </div>
              <p className="text-muted-foreground">
                Upload a photo of your fridge and get personalized recipe suggestions
              </p>
            </button>

            <button
              onClick={() => navigate("/activity")}
              className="group bg-card/90 backdrop-blur-md rounded-2xl p-8 text-left transition-all hover:scale-105 border border-white/20"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Sparkles className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-2xl font-semibold">What should I do?</h3>
              </div>
              <p className="text-muted-foreground">
                Get spontaneous activity suggestions based on time, weather, and your preferences
              </p>
            </button>
          </div>

          {/* Info Section */}
          <div className="bg-primary/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
            <h4 className="font-semibold mb-2 text-white">Welcome to smarter decisions</h4>
            <p className="text-sm text-white/80">
              Our AI helps you make better choices by analyzing your context, preferences, and history. 
              Every decision includes a visual mind-map showing how we reached our recommendation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
