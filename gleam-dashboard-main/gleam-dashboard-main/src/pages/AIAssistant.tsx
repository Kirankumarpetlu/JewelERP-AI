import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import AnimatedSection from "@/components/shared/AnimatedSection";
import { sendChat } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const suggestions = [
  "What is today's gold rate?",
  "Which jewellery sold most this month?",
  "Do we need to restock bangles?",
  "Give me a sales summary for this week",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await sendChat(text);
      setMessages(prev => [...prev, { role: "assistant", content: res.response }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm having trouble connecting to the backend. Please ensure the JewelVault backend is running on port 8000.",
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessage = (content: string) =>
    content.split("\n").map((line, li, arr) => (
      <span key={li}>
        {line.split(/(\*\*[^*]+\*\*)/).map((part, pi) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={pi} className="text-primary">{part.slice(2, -2)}</strong>
            : part
        )}
        {li < arr.length - 1 && <br />}
      </span>
    ));

  return (
    <div className="space-y-6 h-[calc(100vh-7rem)] flex flex-col">
      <AnimatedSection className="shrink-0">
        <h1 className="text-3xl font-display font-bold mb-1 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" /> AI Assistant
        </h1>
        <p className="text-muted-foreground">Ask anything about your jewellery business — powered by Groq AI</p>
      </AnimatedSection>

      <div className="glass-card flex-1 flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center animate-pulse-gold">
                <Sparkles className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold mb-2">How can I help?</h2>
                <p className="text-muted-foreground text-sm">Ask me about gold rates, sales, inventory, or billing</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="glass-button border border-white/[0.06] rounded-lg px-4 py-3 text-sm text-left hover:border-primary/30"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {renderMessage(msg.content)}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="chat-bubble-ai flex gap-1.5 py-4 px-5">
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border/30 p-4">
          <form onSubmit={e => { e.preventDefault(); handleSend(input); }} className="flex gap-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about your jewellery business..."
              className="flex-1 glass-input px-4 py-3 text-sm"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="gold-gradient text-primary-foreground px-4 py-3 rounded-lg transition-all duration-200 active:scale-[0.95] disabled:opacity-40"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
