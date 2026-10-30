"use client";
import { useState, useEffect, useRef } from "react";
import { Scale, Send, Loader2, ShieldCheck, Sparkles, Plus, MessageSquare, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Message = { role: "user" | "assistant"; content: string; sources?: any[] };
type Chat = { id: string; title: string; messages: Message[] };

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Load chat history from LocalStorage on page load
  useEffect(() => {
    const savedChats = localStorage.getItem("solon-chats");
    const savedActiveId = localStorage.getItem("solon-active-chat");
    
    if (savedChats) {
      try {
        const parsed = JSON.parse(savedChats);
        setChats(parsed);
        if (savedActiveId && parsed.find((c: Chat) => c.id === savedActiveId)) {
          setActiveChatId(savedActiveId);
        } else if (parsed.length > 0) {
          setActiveChatId(parsed[0].id);
        }
      } catch (e) {}
    }
  }, []);

  // 2. Save to LocalStorage whenever chats change
  useEffect(() => {
    localStorage.setItem("solon-chats", JSON.stringify(chats));
    if (activeChatId) localStorage.setItem("solon-active-chat", activeChatId);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, activeChatId]);

  const activeChat = chats.find((c) => c.id === activeChatId);

  const startNewChat = () => {
    const newChat: Chat = { id: Date.now().toString(), title: "New Conversation", messages: [] };
    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
  };

  const deleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = chats.filter((c) => c.id !== id);
    setChats(updated);
    if (activeChatId === id) {
      setActiveChatId(updated.length > 0 ? updated[0].id : null);
    }
  };

  // 3. Send chat to Kaggle Backend
  async function ask() {
    if (!input.trim() || loading || !activeChat) return;

    const newMessages = [...activeChat.messages, { role: "user" as const, content: input }];
    setInput("");
    setLoading(true);

    // Update the UI immediately
    setChats((prev) => prev.map((c) => 
      c.id === activeChatId 
        ? { 
            ...c, 
            // Automatically name the chat based on the first message
            title: c.messages.length === 0 ? input.slice(0, 25) + "..." : c.title,
            messages: newMessages 
          } 
        : c
    ));

    try {
      // Send the full conversation history to the proxy
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) throw new Error("Backend failed");

      const data = await res.json();
      setChats((prev) => prev.map((c) => 
        c.id === activeChatId 
          ? { ...c, messages: [...newMessages, { role: "assistant", content: data.answer, sources: data.sources }] } 
          : c
      ));
    } catch (err: any) {
      setChats((prev) => prev.map((c) => 
        c.id === activeChatId 
          ? { ...c, messages: [...newMessages, { role: "assistant", content: `Error: ${err.message}. Check if Kaggle is running.` }] } 
          : c
      ));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-[#030303] text-slate-200 overflow-hidden">
      
      {/* SIDEBAR */}
      <div className="w-64 flex-shrink-0 bg-[#0a0a0f] border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <button onClick={startNewChat} className="w-full flex items-center justify-center gap-2 bg-amber-500 text-black px-4 py-2.5 rounded-xl font-semibold hover:bg-amber-400 transition-all">
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chats.map((chat) => (
            <div 
              key={chat.id} 
              onClick={() => setActiveChatId(chat.id)}
              className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer text-sm transition-colors ${activeChatId === chat.id ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'}`}
            >
              <div className="flex items-center gap-2 truncate">
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{chat.title}</span>
              </div>
              <button onClick={(e) => deleteChat(e, chat.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col relative h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <header className="h-14 border-b border-white/10 flex items-center px-6 backdrop-blur-md bg-black/20 z-10">
          <Scale className="w-5 h-5 text-amber-400 mr-2" />
          <span className="font-semibold">Solon AI</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6 z-10">
          {!activeChat || activeChat.messages.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full opacity-50">
               <Scale className="w-16 h-16 text-slate-600 mb-4" />
               <h2 className="text-xl font-medium text-slate-300 mb-2">How can I help you today?</h2>
               <p className="text-sm text-slate-500">Describe a legal situation to get a constitutional analysis.</p>
             </div>
          ) : (
            <AnimatePresence initial={false}>
              {activeChat.messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[85%] md:max-w-[75%] p-5 rounded-2xl ${msg.role === "user" ? "bg-amber-500 text-black rounded-tr-sm" : "bg-[#14141c]/80 border border-white/10 backdrop-blur-xl rounded-tl-sm text-slate-200 shadow-xl"}`}>
                    
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-semibold text-amber-400">Constitutional Analysis</span>
                      </div>
                    )}

                    <div className={`whitespace-pre-wrap text-sm leading-relaxed ${msg.role === "user" ? "font-medium" : "font-light"}`}>
                      {msg.content}
                    </div>

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-white/5">
                        <div className="flex items-center gap-1.5 mb-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Verified Citations</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((s, idx) => (
                            <span key={idx} className="px-2 py-1 rounded bg-white/5 text-amber-200/80 text-[11px] border border-white/10">
                              {s.article ? `Art. ${s.article}` : s.case}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start">
              <div className="bg-[#14141c]/80 border border-white/10 backdrop-blur-xl p-5 rounded-2xl rounded-tl-sm flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                <span className="text-sm text-slate-400 animate-pulse">Analyzing Constitution...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* INPUT AREA */}
        <div className="p-4 bg-gradient-to-t from-[#030303] via-[#030303] to-transparent z-20">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-indigo-500/20 rounded-3xl blur opacity-50 group-hover:opacity-100 transition duration-500" />
            <div className="relative bg-[#0a0a0f] border border-white/10 rounded-3xl p-2 shadow-2xl flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); }
                }}
                placeholder="Ask about a legal situation..."
                className="w-full max-h-32 min-h-[56px] p-4 bg-transparent outline-none resize-none text-sm text-white placeholder:text-slate-500"
                rows={1}
              />
              <button
                onClick={ask}
                disabled={loading || !input.trim() || !activeChat}
                className="p-3 mb-1 mr-1 rounded-2xl bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50 transition-all flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}