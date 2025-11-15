import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChefHat, Sparkles, Search, LogOut } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [decisionResult, setDecisionResult] = useState<any>(null);
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
    
    setSearching(true);
    setDecisionResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("universal-search", {
        body: { query: searchQuery, userId: user.id },
      });

      if (error) throw error;
      
      setDecisionResult(data);
      toast.success("Decision generated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to process search");
    }
    setSearching(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-subtle)' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Micro-Decision Helper
          </h1>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="max-w-2xl mx-auto space-y-8">
          {/* Universal Search Bar */}
          <div className="bg-card rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
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

          {/* Decision Result */}
          {decisionResult && (
            <div className="bg-card rounded-2xl p-6 space-y-4" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Decision</h3>
                  <p className="text-foreground mb-4">{decisionResult.decision}</p>
                  
                  <h4 className="font-semibold mb-2">Why?</h4>
                  <p className="text-muted-foreground mb-4">{decisionResult.reasoning}</p>
                  
                  {decisionResult.alternatives && decisionResult.alternatives.length > 0 && (
                    <>
                      <h4 className="font-semibold mb-2">Alternative Options:</h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {decisionResult.alternatives.map((alt: string, i: number) => (
                          <li key={i}>{alt}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setDecisionResult(null);
                  setSearchQuery("");
                }}
                className="w-full"
              >
                Ask Another Question
              </Button>
            </div>
          )}

          {/* Main Feature Buttons */}
          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => navigate("/dinner")}
              className="group bg-card rounded-2xl p-8 text-left transition-all hover:scale-105"
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
              className="group bg-card rounded-2xl p-8 text-left transition-all hover:scale-105"
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
          <div className="bg-primary/10 rounded-xl p-6 border border-primary/20">
            <h4 className="font-semibold mb-2 text-primary">Welcome to smarter decisions</h4>
            <p className="text-sm text-muted-foreground">
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
