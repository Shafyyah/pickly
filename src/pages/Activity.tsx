import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { SuggestionCard } from "@/components/SuggestionCard";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const Activity = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [showSurvey, setShowSurvey] = useState(true);
  const [surveyAnswers, setSurveyAnswers] = useState({
    energy: "",
    social: "",
    location: "",
    type: "",
    budget: ""
  });
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/login");
      }
    });
  }, [navigate]);

  const generateActivities = async (userId?: string) => {
    const id = userId || user?.id;
    if (!id) return;

    setLoading(true);
    setPickedIndex(null);
    setExpandedIndex(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-activities", {
        body: { userId: id, preferences: surveyAnswers },
      });

      if (error) throw error;

      setActivities(data.activities);
      toast.success("Activities generated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate activities");
    }
    setLoading(false);
  };

  const handleSurveyComplete = () => {
    const allAnswered = Object.values(surveyAnswers).every(v => v !== "");
    if (!allAnswered) {
      toast.error("Please answer all questions");
      return;
    }
    setShowSurvey(false);
    generateActivities();
  };

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-subtle)' }}>
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {showSurvey ? (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent mb-8">
              Quick Preferences
            </h1>
            
            <div className="bg-card rounded-2xl p-8 space-y-8" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="space-y-4">
                <Label className="text-lg font-semibold">How's your energy level?</Label>
                <RadioGroup value={surveyAnswers.energy} onValueChange={(v) => setSurveyAnswers({...surveyAnswers, energy: v})}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="energy-low" />
                    <Label htmlFor="energy-low" className="cursor-pointer">Low - Need something easy</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moderate" id="energy-mod" />
                    <Label htmlFor="energy-mod" className="cursor-pointer">Moderate - Ready for anything</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="energy-high" />
                    <Label htmlFor="energy-high" className="cursor-pointer">High - Let's go!</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-semibold">Social mood?</Label>
                <RadioGroup value={surveyAnswers.social} onValueChange={(v) => setSurveyAnswers({...surveyAnswers, social: v})}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="solo" id="social-solo" />
                    <Label htmlFor="social-solo" className="cursor-pointer">Solo time</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="small" id="social-small" />
                    <Label htmlFor="social-small" className="cursor-pointer">Small group</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="social" id="social-event" />
                    <Label htmlFor="social-event" className="cursor-pointer">Social event</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-semibold">Where do you want to be?</Label>
                <RadioGroup value={surveyAnswers.location} onValueChange={(v) => setSurveyAnswers({...surveyAnswers, location: v})}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="home" id="loc-home" />
                    <Label htmlFor="loc-home" className="cursor-pointer">Home</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="outdoors" id="loc-outdoors" />
                    <Label htmlFor="loc-outdoors" className="cursor-pointer">Outdoors</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="public" id="loc-public" />
                    <Label htmlFor="loc-public" className="cursor-pointer">Public places</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-semibold">What type of activity?</Label>
                <RadioGroup value={surveyAnswers.type} onValueChange={(v) => setSurveyAnswers({...surveyAnswers, type: v})}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="physical" id="type-physical" />
                    <Label htmlFor="type-physical" className="cursor-pointer">Physical</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="creative" id="type-creative" />
                    <Label htmlFor="type-creative" className="cursor-pointer">Creative</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="relaxing" id="type-relaxing" />
                    <Label htmlFor="type-relaxing" className="cursor-pointer">Relaxing</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="productive" id="type-productive" />
                    <Label htmlFor="type-productive" className="cursor-pointer">Productive</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-semibold">Budget?</Label>
                <RadioGroup value={surveyAnswers.budget} onValueChange={(v) => setSurveyAnswers({...surveyAnswers, budget: v})}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="free" id="budget-free" />
                    <Label htmlFor="budget-free" className="cursor-pointer">Free</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="under20" id="budget-under20" />
                    <Label htmlFor="budget-under20" className="cursor-pointer">Under $20</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="flexible" id="budget-flex" />
                    <Label htmlFor="budget-flex" className="cursor-pointer">Flexible</Label>
                  </div>
                </RadioGroup>
              </div>

              <Button onClick={handleSurveyComplete} className="w-full" size="lg">
                Generate Activities
              </Button>
            </div>
          </div>
        ) : (
          <>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
            What Should I Do?
          </h1>
          <Button
            onClick={() => generateActivities()}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {activities.length === 0 && !loading && (
            <div className="bg-card rounded-2xl p-12 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
              <p className="text-muted-foreground">Generating personalized activities for you...</p>
            </div>
          )}

          {activities.length > 0 && (
            <div className="space-y-6">
              {pickedIndex !== null ? (
                <SuggestionCard
                  title={activities[pickedIndex].title}
                  summary={activities[pickedIndex].summary}
                  details={activities[pickedIndex].details}
                  imageUrl={activities[pickedIndex].imageUrl}
                  onChatMessage={(msg) => console.log("Chat:", msg)}
                  loading={loading}
                  expanded={true}
                  hideButtons={true}
                />
              ) : (
                <>
                  {activities.map((activity, i) => (
                    <SuggestionCard
                      key={i}
                      title={activity.title}
                      summary={activity.summary}
                      details={activity.details}
                      imageUrl={activity.imageUrl}
                      onDoIt={() => {
                        setPickedIndex(i);
                        toast.success(`Let's do: ${activity.title}`);
                      }}
                      onChatMessage={(msg) => console.log("Chat:", msg)}
                      loading={loading}
                      expanded={expandedIndex === i}
                    />
                  ))}
                  
                  {/* Action Buttons at the end */}
                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={() => generateActivities()} 
                      disabled={loading}
                      variant="outline"
                      className="flex-1"
                    >
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Suggest Again
                    </Button>
                    <Button 
                      onClick={() => {
                        const randomIndex = Math.floor(Math.random() * activities.length);
                        setPickedIndex(randomIndex);
                        toast.success(`Let's do: ${activities[randomIndex].title}`);
                      }}
                      disabled={loading}
                      className="flex-1"
                    >
                      Pick For Me
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Activity;
