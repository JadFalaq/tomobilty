'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minus } from 'lucide-react';
import api from '@/lib/api';

interface Message {
  id?: number;
  text: string;
  isUser: boolean;
  timestamp: string;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Générer ou récupérer un ID de session
    let sid = localStorage.getItem('chat_session_id');
    if (!sid) {
      sid = Math.random().toString(36).substring(7);
      localStorage.setItem('chat_session_id', sid);
    }
    setSessionId(sid);

    // Charger l'historique
    // fetchHistory(sid);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      text: input,
      isUser: true,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.post('/chat', {
        prompt: userMessage.text,
        sessionId: sessionId
      });
      const data = res.data;
      
      const botMessage: Message = {
        text: data.answer,
        isUser: false,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        text: "Désolé, je rencontre des difficultés techniques pour le moment.",
        isUser: false,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Fenêtre de chat */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-80 sm:w-96 mb-4 overflow-hidden border border-gray-200 animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-primary-950 text-white p-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="w-2 h-2 bg-green-500 rounded-full absolute bottom-0 right-0 border border-primary-950"></div>
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Assistant Tommobilty</h3>
                <p className="text-xs text-primary-300">En ligne</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-primary-300 hover:text-white transition-colors"
            >
              <Minus className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 bg-gray-50 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8 text-sm">
                <p>👋 Bonjour !</p>
                <p>Je suis là pour répondre à vos questions sur nos voitures et services.</p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    msg.isUser 
                      ? 'bg-gold-500 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écrivez votre message..."
              style={{ color: 'black' }}
              className="flex-1 bg-white border-0 rounded-full px-4 py-2 text-sm text-black placeholder:text-gray-500 focus:ring-2 focus:ring-gold-500 focus:bg-white transition-all outline-none font-medium"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="bg-gold-500 text-gray-900 p-2 rounded-full hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Bouton d'ouverture */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gold-500 hover:bg-gold-600 text-gray-900 p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center group"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6 animate-pulse group-hover:animate-none" />
        )}
      </button>
    </div>
  );
}
