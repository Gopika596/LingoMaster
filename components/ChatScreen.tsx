import React, { useState, useRef, useEffect } from 'react';
import { Send, RefreshCw, User, Sparkles, BookOpen, Volume2, Loader2, StopCircle, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Message, UserConfig } from '../types';
import { geminiService } from '../services/geminiService';

interface ChatScreenProps {
  config: UserConfig;
  initialMessages: Message[];
  onUpdateMessages: (messages: Message[]) => void;
  onReset: () => void;
  onPracticeVocabulary: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ config, initialMessages, onUpdateMessages, onReset, onPracticeVocabulary }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Notify parent of message updates
  useEffect(() => {
    onUpdateMessages(messages);
  }, [messages, onUpdateMessages]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const handleGenerateSummary = async () => {
    if (messages.length < 3 || isGeneratingSummary) return;

    setIsGeneratingSummary(true);
    const summaryId = Date.now().toString();
    
    setMessages(prev => [...prev, {
      id: summaryId,
      role: 'model',
      text: 'Generating a summary of your learning...',
      timestamp: Date.now(),
      isStreaming: true
    }]);

    try {
      const summary = await geminiService.generateSummary(messages, config.nativeLanguage);
      setMessages(prev => prev.map(msg => 
        msg.id === summaryId 
          ? { ...msg, text: `📝 **Conversation Summary & Learning Points:**\n\n${summary}`, isStreaming: false } 
          : msg
      ));
    } catch (error: any) {
      setMessages(prev => prev.map(msg => 
        msg.id === summaryId 
          ? { ...msg, text: `⚠️ Failed to generate summary: ${error.message}`, isStreaming: false } 
          : msg
      ));
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const speakText = (text: string, id: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingMessageId(id);

    try {
      let textToSpeak = text;
      const englishMatch = text.match(/\*\*English:\*\*\s*([\s\S]*?)(?=\*\*|$)/i);
      if (englishMatch && englishMatch[1]) textToSpeak = englishMatch[1];
      
      textToSpeak = textToSpeak.replace(/[\*\_]/g, '').trim();

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'en-US';
      utterance.onend = () => setSpeakingMessageId(null);
      utterance.onerror = () => setSpeakingMessageId(null);
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error(error);
      setSpeakingMessageId(null);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
      inputRef.current?.focus();
  }, []);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const tempId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: tempId,
        role: 'model',
        text: '...',
        timestamp: Date.now(),
        isStreaming: true
      }]);

      await geminiService.sendMessageStream(userMsg.text, (streamedText) => {
        setMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, text: streamedText, isStreaming: false } 
            : msg
        ));
      });
    } catch (error: any) {
      setMessages(prev => prev.filter(msg => msg.text !== '...'));
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: `⚠️ **Error:** ${error.message || "Connection error. Please retry."}`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const isSessionEnded = messages.some(m => m.role === 'user' && m.text.trim() === '/END');

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
       {/* Background Elements */}
       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-50 via-white to-slate-50 opacity-80 pointer-events-none"></div>
       <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-200/30 rounded-full mix-blend-multiply filter blur-[60px] animate-float pointer-events-none"></div>
       <div className="absolute bottom-20 left-10 w-80 h-80 bg-pink-200/30 rounded-full mix-blend-multiply filter blur-[60px] animate-float pointer-events-none" style={{ animationDelay: '2s' }}></div>

      {/* Header - Sticky Glass */}
      <header className="absolute top-0 left-0 right-0 z-20 px-6 py-4 flex items-center justify-between glass-card border-b-0 rounded-b-3xl mx-2 mt-2 sm:mx-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-extrabold text-slate-800 text-sm tracking-wide uppercase">LingoMaster</h2>
            <div className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
               <span className="text-xs font-semibold text-slate-500 truncate max-w-[120px] sm:max-w-xs">{config.scenario}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onPracticeVocabulary}
            className="p-2 rounded-full transition-all flex items-center gap-2 px-3 text-indigo-600 hover:bg-indigo-50 active:scale-95"
            title="Practice Vocabulary"
          >
            <BookOpen className="w-5 h-5" />
            <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Practice</span>
          </button>
          <button 
            onClick={handleGenerateSummary}
            disabled={messages.length < 3 || isGeneratingSummary}
            className={`p-2 rounded-full transition-all flex items-center gap-2 px-3
              ${messages.length < 3 || isGeneratingSummary 
                ? 'text-slate-300 cursor-not-allowed' 
                : 'text-indigo-600 hover:bg-indigo-50 active:scale-95'}`}
            title="Generate Learning Summary"
          >
            {isGeneratingSummary ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
            <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Summary</span>
          </button>
          <button 
            onClick={onReset}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors"
            title="Restart Session"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto pt-24 pb-32 px-4 sm:px-6 space-y-6 scroll-smooth z-10 custom-scrollbar">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex w-full animate-slideUp group ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex flex-col max-w-[90%] sm:max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              
              <div className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm mt-1
                  ${msg.role === 'user' 
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500' 
                    : 'bg-white border border-slate-200'}`}>
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                  )}
                </div>

                {/* Bubble */}
                <div className={`p-4 sm:p-5 shadow-sm text-[15px] sm:text-base leading-relaxed
                  ${msg.role === 'user' 
                    ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl rounded-tr-sm shadow-indigo-500/20 shadow-md' 
                    : 'bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-tl-sm shadow-slate-200/50'
                  }`}>
                  
                  {msg.isStreaming && msg.text === '...' ? (
                    <div className="flex gap-1.5 py-1">
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                  ) : (
                    <div className="markdown-content">
                       <ReactMarkdown 
                        components={{
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                          strong: ({node, ...props}) => (
                            <span className={`font-bold ${msg.role === 'user' ? 'text-white' : 'text-indigo-700'}`} {...props} />
                          ),
                        }}
                       >
                         {msg.text}
                       </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className={`flex items-center gap-2 mt-1.5 ${msg.role === 'user' ? 'mr-12' : 'ml-12'}`}>
                {msg.role === 'model' && !msg.isStreaming && !msg.text.includes('🎤 **Pronunciation Feedback:**') && !msg.text.includes('📝 **Conversation Summary & Learning Points:**') && (
                  <>
                    <button 
                      onClick={() => speakText(msg.text, msg.id)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all
                        ${speakingMessageId === msg.id 
                          ? 'bg-indigo-100 text-indigo-700' 
                          : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                    >
                      {speakingMessageId === msg.id ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" /> Playing
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" /> Listen
                        </>
                      )}
                    </button>
                  </>
                )}
                <span className="text-[10px] font-bold text-slate-300">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {isSessionEnded && (
          <div className="flex justify-center py-4">
             <span className="px-4 py-2 bg-slate-100 text-slate-500 rounded-full text-xs font-bold uppercase tracking-widest border border-slate-200">
               Session Ended
             </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Dock - Floating */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-20 flex justify-center bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent pt-10">
        <form 
          onSubmit={handleSendMessage}
          className="w-full max-w-3xl glass-card rounded-[2rem] p-2 pr-3 shadow-2xl shadow-indigo-900/5 ring-1 ring-white/60 flex items-center gap-2 transition-all duration-300 focus-within:ring-indigo-500/30 focus-within:shadow-indigo-500/10"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            disabled={isTyping || isSessionEnded}
            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 placeholder:text-slate-400 font-medium text-lg px-6"
          />
          
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping || isSessionEnded}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-md
              ${!inputText.trim() || isTyping || isSessionEnded
                ? 'bg-slate-100 text-slate-300'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95 shadow-indigo-500/30'}`}
          >
             {isSessionEnded ? <StopCircle className="w-5 h-5" /> : <Send className="w-5 h-5 ml-0.5" />}
          </button>
        </form>
      </div>
    </div>
  );
};
