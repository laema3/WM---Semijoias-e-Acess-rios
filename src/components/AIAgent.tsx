import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
const getAIClient = () => {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({ apiKey });
    }
  }
  return aiClient;
};

export default function AIAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: 'Olá! Sou o assistente virtual da WM SEMIJOIAS. Como posso ajudar você hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = getAIClient();
      if (!ai) {
        throw new Error("API Key do Gemini não configurada.");
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: `Você é o assistente virtual da WM SEMIJOIAS E ACESSÓRIOS. Uma loja de joias e semijoias de luxo. 
          Cores da marca: Amarelo e Preto.
          Produtos: Anéis, Brincos, Colares, Pulseiras.
          Garantia: 1 ano.
          Diferenciais: Hipoalergênico, banho de alta qualidade.
          Localização: São Paulo, SP.
          Pergunta do cliente: ${userMessage}` }] }
        ],
      });

      const botResponse = response.text || 'Desculpe, tive um problema ao processar sua solicitação.';
      setMessages(prev => [...prev, { role: 'model', text: botResponse }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: 'Desculpe, estou offline no momento ou a chave da API não está configurada.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-8 w-14 h-14 bg-primary text-black rounded-full shadow-2xl flex items-center justify-center hover:bg-yellow-500 transition-colors z-40"
      >
        <Bot size={28} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-8 right-8 w-full max-w-[350px] h-[500px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden z-[100] border border-black/5"
          >
            {/* Header */}
            <div className="bg-black p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <Bot size={20} className="text-black" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">WM Assistant</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Online</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-neutral-50">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-black text-white rounded-tr-none' 
                      : 'bg-white text-black shadow-sm rounded-tl-none border border-black/5'
                  }`}>
                    <Markdown>{msg.text}</Markdown>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-black/5">
                    <Loader2 size={16} className="animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Digite sua dúvida..."
                  className="flex-1 bg-neutral-100 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading}
                  className="bg-black text-white p-3 rounded-xl hover:bg-primary hover:text-black transition-all disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
