import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, Loader2, Sparkles, Shield, Zap, Brain, Target, Lock, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: "user" | "bot";
  text: string;
}

interface ChatBotProps {
  userId?: number | string;
}

export function ChatBot({ userId }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hello! I'm your SecureBank AI assistant. How can I help you with your finances today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    const currentUserId = userId || 65;
    
    const savedPayeesRaw = localStorage.getItem(`payees_${currentUserId}`);
    const savedPayees = savedPayeesRaw ? JSON.parse(savedPayeesRaw) : [];

    const payeeContext = savedPayees.length > 0 
      ? `[SYSTEM CONTEXT: You MUST ONLY use the following real saved payees found in the database: ${savedPayees.map((p: any) => 
          `${p.name} (Account: ${p.account_number}, Sort Code: ${p.sort_code})`
        ).join(", ")}. 
        - DO NOT suggest names like John Doe or Jane Smith if they are not in this list. 
        - If the user asks for names, list only these real payees. 
        - If the user asks for details, show a Markdown table with Name, Account Number, and Sort Code.
        - ALWAYS ask for confirmation before calling a transfer tool.] `
      : "[SYSTEM CONTEXT: The user has NO saved payees in the database. If they ask, tell them they need to add one first. Do not hallucinate sample data.] ";

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await fetch("/chat-bot-api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: payeeContext + userMsg,
          user_id: Number(currentUserId)
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages((prev) => [
          ...prev, 
          { role: "bot", text: data.reply || "I've processed your request successfully." }
        ]);

        const lowerReply = (data.reply || "").toLowerCase();
        if (
          lowerReply.includes("transfer") || 
          lowerReply.includes("sent") || 
          lowerReply.includes("success") || 
          lowerReply.includes("completed") ||
          lowerReply.includes("balance") ||
          lowerReply.includes("updated")
        ) {
          window.dispatchEvent(new Event("balanceUpdated"));
        }
      } else {
        const errorText = data.error || "I'm having trouble connecting to the banking gateway. Please try again.";
        setMessages((prev) => [...prev, { role: "bot", text: errorText }]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev, 
        { role: "bot", text: "Connection issue detected. Please check your network." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end font-sans">
      {isOpen && (
        <div className="mb-6 w-88 md:w-[420px] h-[540px] bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-emerald-950/90 backdrop-blur-xl border border-slate-700/40 rounded-2xl shadow-2xl shadow-emerald-900/20 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          
          {/* Header - Updated to match dashboard */}
          <div className="p-5 bg-gradient-to-r from-slate-800/60 via-slate-800/50 to-emerald-900/50 border-b border-slate-700/40 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-600/40 to-cyan-600/40 border border-emerald-500/30 shadow-lg shadow-emerald-900/20">
                  <Bot className="h-5 w-5 text-emerald-200" />
                </div>
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 animate-pulse ring-2 ring-slate-900"></div>
              </div>
              <div>
                <p className="font-bold text-slate-100 text-sm leading-none">SecureBank AI</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Lock className="h-3 w-3 text-cyan-400" />
                  <p className="text-[10px] text-cyan-400/80 font-medium">Banking Assistant</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-800/60 border border-slate-600/40">
                <Zap className="h-3 w-3 text-cyan-400" />
                <span className="text-xs text-cyan-300">Live</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)} 
                className="text-slate-300 hover:text-emerald-100 hover:bg-slate-700/40 rounded-xl transition-all border border-slate-600/40 hover:border-emerald-500/40"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Chat Messages - Updated colors */}
          <div 
            ref={scrollRef} 
            className="flex-1 overflow-y-auto p-5 space-y-4 scroll-smooth bg-gradient-to-b from-slate-900/30 via-slate-900/20 to-transparent"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(6, 78, 59, 0.3) transparent' }}
          >
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed transition-all duration-200 markdown-container ${
                  msg.role === "user" 
                    ? "bg-gradient-to-r from-emerald-600/80 to-cyan-600/80 text-white rounded-br-none shadow-lg shadow-emerald-900/30" 
                    : "bg-gradient-to-r from-slate-800/50 to-slate-800/30 text-slate-100 border border-slate-700/40 rounded-bl-none"
                }`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gradient-to-r from-slate-800/50 to-slate-800/30 p-4 rounded-2xl rounded-bl-none border border-slate-700/40 flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-r from-emerald-600/40 to-cyan-600/40 flex items-center justify-center">
                    <Brain className="h-3 w-3 text-emerald-300" />
                  </div>
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce"></div>
                    <div className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="h-2 w-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area - Updated colors */}
          <div className="p-5 bg-gradient-to-t from-slate-900/80 via-slate-900/60 to-transparent border-t border-slate-700/40 flex gap-3">
            <div className="relative flex-1 group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about balance, transfers, or banking..."
                className="relative w-full bg-slate-800/40 border border-slate-600/30 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-400/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
              />
            </div>
            <Button 
              size="icon" 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20 border border-emerald-500/30"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Footer - Updated colors */}
          <div className="px-5 py-3 bg-gradient-to-t from-slate-900 via-slate-900/90 to-slate-900/80 border-t border-slate-700/40">
            <p className="text-xs text-center text-slate-400/60 flex items-center justify-center gap-2">
              <Activity className="h-3 w-3 text-cyan-400/70" />
              <span>Powered by SecureBank AI</span>
              <Target className="h-3 w-3 text-emerald-400/70" />
              <span>End-to-end encrypted</span>
            </p>
          </div>
        </div>
      )}

      {/* Toggle Button - Updated colors */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className={`h-16 w-16 rounded-full shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 relative group ${
          isOpen 
            ? "bg-gradient-to-br from-slate-800/50 to-emerald-900/40 backdrop-blur-xl text-slate-100 border border-slate-700/40 hover:border-emerald-500/40" 
            : "bg-gradient-to-br from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-lg shadow-emerald-900/30 border border-emerald-500/30"
        }`}
      >
        {isOpen ? (
          <X className="h-7 w-7" />
        ) : (
          <>
            <MessageSquare className="h-7 w-7" />
            {/* Pulsing effect with updated colors */}
            <div className="absolute -inset-1 bg-emerald-500/20 rounded-full animate-ping opacity-20"></div>
          </>
        )}
        
        {/* Notification dot */}
        {!isOpen && messages.length > 1 && (
          <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 border-2 border-slate-900 flex items-center justify-center shadow-lg">
            <span className="text-xs font-bold text-white">{messages.length - 1}</span>
          </div>
        )}
      </Button>
    </div>
  );
}
// import { useState, useRef, useEffect } from "react";
// import { MessageSquare, X, Send, Bot, Loader2, Sparkles, Shield, Zap, Brain } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm';

// interface Message {
//   role: "user" | "bot";
//   text: string;
// }

// interface ChatBotProps {
//   userId?: number | string;
// }

// export function ChatBot({ userId }: ChatBotProps) {
//   const [isOpen, setIsOpen] = useState(false);
//   const [messages, setMessages] = useState<Message[]>([
//     { role: "bot", text: "Hello! I'm your SecureBank AI assistant. How can I help you with your finances today?" }
//   ]);
//   const [input, setInput] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const scrollRef = useRef<HTMLDivElement>(null);

//   // Auto-scroll to bottom when messages change
//   useEffect(() => {
//     if (scrollRef.current) {
//       scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
//     }
//   }, [messages, isLoading]);

//   const handleSend = async () => {
//     if (!input.trim() || isLoading) return;

//     const userMsg = input;
//     const currentUserId = userId || 65; // Defaulting to 65 based on your curl tests
    
//     // 1. FETCH REAL SAVED PAYEES FROM LOCALSTORAGE
//     // We use the same key used in your frontend logic
//     const savedPayeesRaw = localStorage.getItem(`payees_${currentUserId}`);
//     const savedPayees = savedPayeesRaw ? JSON.parse(savedPayeesRaw) : [];

//     // 2. FORMAT PAYEES INTO A STRICT CONTEXT BLOCK
//     // Using account_number and sort_code to match the ORA-01745 fix in the backend
//     const payeeContext = savedPayees.length > 0 
//       ? `[SYSTEM CONTEXT: You MUST ONLY use the following real saved payees found in the database: ${savedPayees.map((p: any) => 
//           `${p.name} (Account: ${p.account_number}, Sort Code: ${p.sort_code})`
//         ).join(", ")}. 
//         - DO NOT suggest names like John Doe or Jane Smith if they are not in this list. 
//         - If the user asks for names, list only these real payees. 
//         - If the user asks for details, show a Markdown table with Name, Account Number, and Sort Code.
//         - ALWAYS ask for confirmation before calling a transfer tool.] `
//       : "[SYSTEM CONTEXT: The user has NO saved payees in the database. If they ask, tell them they need to add one first. Do not hallucinate sample data.] ";

//     // Clear input and show user message immediately
//     setInput("");
//     setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
//     setIsLoading(true);

//     try {
//       // 3. CALL CHATBOT API WITH GROUNDED CONTEXT
//       const response = await fetch("/chat-bot-api/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ 
//           text: payeeContext + userMsg,
//           user_id: Number(currentUserId)
//         }),
//       });

//       const data = await response.json();
      
//       if (response.ok) {
//         setMessages((prev) => [
//           ...prev, 
//           { role: "bot", text: data.reply || "I've processed your request successfully." }
//         ]);

//         // Trigger dashboard refresh if a transaction occurred
//         const lowerReply = (data.reply || "").toLowerCase();
//         if (
//           lowerReply.includes("transfer") || 
//           lowerReply.includes("sent") || 
//           lowerReply.includes("success") || 
//           lowerReply.includes("completed") ||
//           lowerReply.includes("balance") ||
//           lowerReply.includes("updated")
//         ) {
//           window.dispatchEvent(new Event("balanceUpdated"));
//         }
//       } else {
//         const errorText = data.error || "I'm having trouble connecting to the banking gateway. Please try again.";
//         setMessages((prev) => [...prev, { role: "bot", text: errorText }]);
//       }
//     } catch (err) {
//       setMessages((prev) => [
//         ...prev, 
//         { role: "bot", text: "Connection issue detected. Please check your network." }
//       ]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end font-sans">
//       {isOpen && (
//         <div className="mb-6 w-88 md:w-[420px] h-[540px] bg-gradient-to-b from-emerald-950/95 to-teal-950/95 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-900/30 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          
//           {/* Header */}
//           <div className="p-5 bg-gradient-to-r from-emerald-900/50 to-teal-900/50 border-b border-emerald-500/30 flex justify-between items-center">
//             <div className="flex items-center gap-3">
//               <div className="relative">
//                 <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border border-emerald-500/40 shadow-lg shadow-emerald-900/20">
//                   <Bot className="h-5 w-5 text-emerald-200" />
//                 </div>
//                 <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 animate-pulse ring-2 ring-emerald-900"></div>
//               </div>
//               <div>
//                 <p className="font-bold text-emerald-100 text-sm leading-none">SecureBank AI</p>
//                 <div className="flex items-center gap-1 mt-0.5">
//                   <Shield className="h-3 w-3 text-emerald-400" />
//                   <p className="text-[10px] text-emerald-400 font-medium">Banking Assistant</p>
//                 </div>
//               </div>
//             </div>
//             <div className="flex items-center gap-2">
//               <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-900/40 border border-emerald-500/30">
//                 <Zap className="h-3 w-3 text-emerald-400" />
//                 <span className="text-xs text-emerald-300">Live</span>
//               </div>
//               <Button 
//                 variant="ghost" 
//                 size="icon" 
//                 onClick={() => setIsOpen(false)} 
//                 className="text-emerald-300 hover:text-emerald-100 hover:bg-emerald-500/20 rounded-xl transition-all"
//               >
//                 <X className="h-5 w-5" />
//               </Button>
//             </div>
//           </div>

//           {/* Chat Messages */}
//           <div 
//             ref={scrollRef} 
//             className="flex-1 overflow-y-auto p-5 space-y-4 scroll-smooth bg-gradient-to-b from-emerald-950/30 to-transparent"
//             style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(34, 197, 94, 0.1) transparent' }}
//           >
//             {messages.map((msg, i) => (
//               <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
//                 <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed transition-all duration-200 markdown-container ${
//                   msg.role === "user" 
//                     ? "bg-gradient-to-r from-emerald-500/80 to-teal-500/80 text-white rounded-br-none shadow-lg shadow-emerald-900/30" 
//                     : "bg-gradient-to-r from-emerald-900/40 to-teal-900/40 text-emerald-100 border border-emerald-500/20 rounded-bl-none"
//                 }`}>
//                   <ReactMarkdown remarkPlugins={[remarkGfm]}>
//                     {msg.text}
//                   </ReactMarkdown>
//                 </div>
//               </div>
//             ))}
//             {isLoading && (
//               <div className="flex justify-start animate-pulse">
//                 <div className="bg-gradient-to-r from-emerald-900/40 to-teal-900/40 p-4 rounded-2xl rounded-bl-none border border-emerald-500/20 flex items-center gap-3">
//                   <div className="h-6 w-6 rounded-full bg-gradient-to-r from-emerald-500/30 to-teal-500/30 flex items-center justify-center">
//                     <Brain className="h-3 w-3 text-emerald-400" />
//                   </div>
//                   <div className="flex gap-1">
//                     <div className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce"></div>
//                     <div className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
//                     <div className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Input Area */}
//           <div className="p-5 bg-gradient-to-t from-emerald-950/80 to-transparent border-t border-emerald-500/20 flex gap-3">
//             <div className="relative flex-1 group">
//               <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//               <input
//                 type="text"
//                 value={input}
//                 onChange={(e) => setInput(e.target.value)}
//                 onKeyDown={(e) => e.key === "Enter" && handleSend()}
//                 placeholder="Ask about balance, transfers, or banking..."
//                 className="relative w-full bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-white placeholder:text-emerald-300/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400/50 transition-all"
//               />
//             </div>
//             <Button 
//               size="icon" 
//               onClick={handleSend} 
//               disabled={isLoading || !input.trim()}
//               className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
//             >
//               <Send className="h-4 w-4" />
//             </Button>
//           </div>

//           {/* Footer */}
//           <div className="px-5 py-3 bg-gradient-to-t from-emerald-950 to-emerald-950/50 border-t border-emerald-500/10">
//             <p className="text-xs text-center text-emerald-400/60 flex items-center justify-center gap-2">
//               <Sparkles className="h-3 w-3" />
//               Powered by SecureBank AI • End-to-end encrypted
//             </p>
//           </div>
//         </div>
//       )}

//       {/* Toggle Button */}
//       <Button
//         onClick={() => setIsOpen(!isOpen)}
//         size="icon"
//         className={`h-16 w-16 rounded-full shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 relative group ${
//           isOpen 
//             ? "bg-gradient-to-br from-emerald-900/40 to-teal-900/40 backdrop-blur-xl text-emerald-100 border border-emerald-500/30 hover:border-emerald-400/50" 
//             : "bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-900/30"
//         }`}
//       >
//         {isOpen ? (
//           <X className="h-7 w-7" />
//         ) : (
//           <>
//             <MessageSquare className="h-7 w-7" />
//             <div className="absolute -inset-1 bg-emerald-500/30 rounded-full animate-ping opacity-20"></div>
//           </>
//         )}
//       </Button>
//     </div>
//   );
// }