"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Terminal, Loader2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function ChatSidebar() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "assistant", content: "I'm your Command Center AI. I have semantic access to your local codebase. You must run **Deep Indexing** on a project first for me to understand its source files. What would you like to know?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  async function parseStream(reader: ReadableStreamDefaultReader<Uint8Array>, assistantMessageId: string) {
    const decoder = new TextDecoder("utf-8");
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
            const token = data.choices[0]?.delta?.content || "";
            
            setMessages((prev) => prev.map((msg) => 
              msg.id === assistantMessageId 
                ? { ...msg, content: msg.content + token }
                : msg
            ));
          } catch (e) {
            console.debug("Malformed JSON chunk", e);
          }
        }
      }
    }
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    const assistantMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: assistantMessageId, role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!res.ok) {
        throw new Error(await res.text() || "Failed to fetch response");
      }
      
      if (!res.body) throw new Error("No response body");
      
      await parseStream(res.body.getReader(), assistantMessageId);
    } catch (err: any) {
      setMessages((prev) => prev.map((msg) => 
        msg.id === assistantMessageId 
          ? { ...msg, content: `⚠️ **Error:** ${err.message}` }
          : msg
      ));
    } finally {
      setIsTyping(false);
    }
  }

  // Floating trigger button
  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        title="Open Chat"
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-50 border border-primary/20 hover:shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-background"
      >
        <Terminal className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full h-[100dvh] sm:w-[400px] sm:h-[600px] bg-background/95 backdrop-blur shadow-2xl sm:rounded-xl border border-border/50 flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50 bg-accent/30">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <h3 className="font-mono text-xs uppercase tracking-widest text-foreground font-semibold">Command Center AI</h3>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsOpen(false)}
            title="Close Chat"
            className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm"
      >
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={cn(
              "flex flex-col max-w-[85%] gap-1",
              msg.role === "user" ? "ml-auto" : "mr-auto"
            )}
          >
            <div className={cn(
              "flex items-center gap-1.5 mb-0.5",
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            )}>
              {msg.role === "user" ? (
                <User className="h-3 w-3 text-muted-foreground" />
              ) : (
                <Bot className="h-3 w-3 text-primary" />
              )}
              <span className="text-[10px] uppercase text-muted-foreground font-bold">
                {msg.role === "user" ? "You" : "Command AI"}
              </span>
            </div>
            
            <div className={cn(
              "p-3 rounded-lg border",
              msg.role === "user" 
                ? "bg-primary text-primary-foreground border-primary/50 rounded-tr-none" 
                : "bg-accent/40 text-foreground border-accent-foreground/10 rounded-tl-none whitespace-pre-wrap"
            )}>
              {msg.content}
              {isTyping && msg.role === "assistant" && msg.content === "" && (
                <Loader2 className="h-4 w-4 animate-spin opacity-50" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-border/50 bg-background">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder="Ask about your drive..."
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono"
          />
          <button
            type="submit"
            title="Send Message"
            disabled={isTyping || !input.trim()}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-10 shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <p className="text-[9px] font-mono text-center text-muted-foreground/50 mt-2">
          Requires OPENAI_API_KEY in .env
        </p>
      </div>
    </div>
  );
}
