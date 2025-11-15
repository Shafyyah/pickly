import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ChefHat, Sparkles, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface SuggestionCardProps {
  title: string;
  summary: string;
  details?: {
    ingredients?: string[];
    steps?: string[];
    time?: string;
    tips?: string;
    description?: string;
    duration?: string;
    instructions?: string[];
  };
  imageUrl?: string;
  onDoIt?: () => void;
  onSuggestAgain?: () => void;
  onPickForMe?: () => void;
  onChatMessage: (message: string) => void;
  loading?: boolean;
  expanded?: boolean;
  hideButtons?: boolean;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const SuggestionCard = ({
  title,
  summary,
  details,
  imageUrl,
  onDoIt,
  onSuggestAgain,
  onPickForMe,
  onChatMessage,
  loading,
  expanded: externalExpanded,
  hideButtons,
}: SuggestionCardProps) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const expanded = externalExpanded !== undefined ? externalExpanded : internalExpanded;

  // Helper function to render markdown italics
  const renderMarkdownItalics = (text: string) => {
    // Convert markdown italics (*text* or _text_) to HTML <em> tags
    const html = text.replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/_([^_]+)_/g, '<em>$1</em>');
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const handleDoIt = () => {
    if (externalExpanded === undefined) {
      setInternalExpanded(true);
    }
    onDoIt?.();
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || isSending) return;

    const userMessage = chatMessage.trim();
    setChatMessage("");
    setShowChat(true);
    
    // Add user message to chat history
    const newUserMsg: ChatMessage = { role: "user", content: userMessage };
    setChatHistory(prev => [...prev, newUserMsg]);
    
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat-modify", {
        body: {
          messages: [...chatHistory, newUserMsg].map(m => ({
            role: m.role,
            content: m.content
          })),
          currentItem: { title, summary, details }
        }
      });

      if (error) throw error;

      // Add AI response to chat history
      const aiResponse: ChatMessage = {
        role: "assistant",
        content: data.response
      };
      setChatHistory(prev => [...prev, aiResponse]);
      
      onChatMessage(userMessage);
    } catch (error: any) {
      console.error("Error sending message:", error);
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again."
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className={`bg-card/30 backdrop-blur-md rounded-2xl p-6 border border-white/20 transition-all duration-300 ${
        expanded ? "scale-105" : ""
      }`}
      style={{ boxShadow: expanded ? 'var(--shadow-card)' : 'var(--shadow-soft)' }}
    >
      {imageUrl && (
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-64 object-cover rounded-xl mb-4"
        />
      )}
      
      <div className="flex items-start gap-3 mb-4">
        {details?.ingredients ? (
          <ChefHat className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
        ) : (
          <Sparkles className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
        )}
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground whitespace-pre-line">
            {renderMarkdownItalics(summary)}
          </p>
        </div>
      </div>

      {expanded && details && (
        <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {details.ingredients && (
            <div>
              <h4 className="font-semibold mb-2">Ingredients:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {details.ingredients.map((ingredient, i) => (
                  <li key={i}>{ingredient}</li>
                ))}
              </ul>
            </div>
          )}

          {details.steps && (
            <div>
              <h4 className="font-semibold mb-2">Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                {details.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {details.instructions && (
            <div>
              <h4 className="font-semibold mb-2">Instructions:</h4>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                {details.instructions.map((instruction, i) => (
                  <li key={i}>{instruction}</li>
                ))}
              </ul>
            </div>
          )}

          {details.description && (
            <div>
              <h4 className="font-semibold mb-2">Details:</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {renderMarkdownItalics(details.description)}
              </p>
            </div>
          )}

          {(details.time || details.duration) && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">Time:</span>
              <span className="text-muted-foreground">{details.time || details.duration}</span>
            </div>
          )}

          {details.tips && (
            <div className="bg-primary/10 rounded-lg p-3">
              <p className="text-sm font-medium text-primary">{details.tips}</p>
            </div>
          )}
        </div>
      )}

      {!hideButtons && (
        <>
          <div className="mt-6">
            <Button
              onClick={handleDoIt}
              className="w-full"
              disabled={loading}
            >
              Do It
            </Button>
          </div>

          {showChat && chatHistory.length > 0 && (
            <div className="mt-4">
              <ScrollArea className="h-64 rounded-lg border bg-muted/30 p-4">
                <div className="space-y-4">
                  {chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-card-foreground"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {isSending && (
                    <div className="flex justify-start">
                      <div className="bg-card text-card-foreground rounded-lg px-4 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Input
              placeholder="Ask for modifications..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              disabled={isSending}
            />
            <Button onClick={handleSendMessage} disabled={isSending || !chatMessage.trim()} size="icon">
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
