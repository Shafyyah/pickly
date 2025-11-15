import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, X, Loader2 } from "lucide-react";
import { SuggestionCard } from "@/components/SuggestionCard";
import { toast } from "sonner";
import type { MindMapNode } from "@/components/MindMap";

const Dinner = () => {
  const [user, setUser] = useState<any>(null);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/login");
      }
    });

    // Add paste event listener for clipboard images
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
            toast.success("Image pasted from clipboard!");
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [navigate]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image || !user) return;

    setLoading(true);
    try {
      // Upload image to storage
      const fileName = `${user.id}/${Date.now()}-${image.name}`;
      const { error: uploadError } = await supabase.storage
        .from("fridge-photos")
        .upload(fileName, image);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("fridge-photos")
        .getPublicUrl(fileName);

      // Analyze ingredients
      const { data, error } = await supabase.functions.invoke("analyze-ingredients", {
        body: { imageUrl: publicUrl, userId: user.id },
      });

      if (error) throw error;

      setIngredients(data.ingredients);
      toast.success("Ingredients detected!");
    } catch (error: any) {
      toast.error(error.message || "Failed to analyze image");
    }
    setLoading(false);
  };

  const generateRecipes = async () => {
    if (!user || ingredients.length === 0) return;

    setLoading(true);
    setPickedIndex(null);
    setExpandedIndex(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-recipes", {
        body: { ingredients, userId: user.id },
      });

      if (error) throw error;

      setRecipes(data.recipes);
      toast.success("Recipes generated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate recipes");
    }
    setLoading(false);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-subtle)' }}>
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
          What Should I Cook Tonight?
        </h1>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Image Upload */}
          {!preview && (
            <div className="bg-card rounded-2xl p-12 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Upload className="w-10 h-10 text-secondary" />
                </div>
                <div>
                  <p className="text-xl font-semibold mb-2">Upload a photo of your fridge</p>
                  <p className="text-muted-foreground">Click to select or paste an image (Ctrl+V / Cmd+V)</p>
                </div>
              </label>
            </div>
          )}

          {/* Image Preview */}
          {preview && !ingredients.length && (
            <div className="bg-card rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
              <img
                src={preview}
                alt="Fridge contents"
                className="w-full max-h-96 object-contain rounded-lg mb-4"
              />
              <div className="flex gap-3">
                <Button onClick={analyzeImage} disabled={loading} className="flex-1">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Analyze Ingredients
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPreview(null);
                    setImage(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Ingredients List */}
          {ingredients.length > 0 && !recipes.length && (
            <div className="bg-card rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
              <h3 className="text-xl font-semibold mb-4">Detected Ingredients</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {ingredients.map((ingredient, i) => (
                  <div
                    key={i}
                    className="bg-secondary/10 px-4 py-2 rounded-full flex items-center gap-2"
                  >
                    <span>{ingredient}</span>
                    <button
                      onClick={() => removeIngredient(i)}
                      className="hover:text-destructive transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Button onClick={generateRecipes} disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Generate Recipes
              </Button>
            </div>
          )}

          {/* Recipes */}
          {recipes.length > 0 && (
            <div className="space-y-6">
              {pickedIndex !== null ? (
                <SuggestionCard
                  title={recipes[pickedIndex].title}
                  summary={recipes[pickedIndex].summary}
                  details={recipes[pickedIndex].details}
                  imageUrl={recipes[pickedIndex].imageUrl}
                  onChatMessage={(msg) => console.log("Chat:", msg)}
                  loading={loading}
                  expanded={true}
                  hideButtons={true}
                />
              ) : (
                <>
                  {recipes.map((recipe, i) => (
                <SuggestionCard
                  key={i}
                  title={recipe.title}
                  summary={recipe.summary}
                  details={recipe.details}
                  imageUrl={recipe.imageUrl}
                  onDoIt={() => {
                    setPickedIndex(i);
                    toast.success(`Let's make: ${recipe.title}`);
                  }}
                  onChatMessage={(msg) => console.log("Chat:", msg)}
                  loading={loading}
                  expanded={expandedIndex === i}
                />
                  ))}
                  
                  {/* Action Buttons at the end */}
                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={generateRecipes} 
                      disabled={loading}
                      variant="outline"
                      className="flex-1"
                    >
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Suggest Again
                    </Button>
                    <Button 
                      onClick={() => {
                        const randomIndex = Math.floor(Math.random() * recipes.length);
                        setPickedIndex(randomIndex);
                        toast.success(`Let's make: ${recipes[randomIndex].title}`);
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
      </div>
    </div>
  );
};

export default Dinner;
