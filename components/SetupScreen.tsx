import React, { useState, useEffect } from 'react';
import { 
  Languages, ArrowRight, BookOpen, 
  Briefcase, Utensils, Plane, Stethoscope, 
  ShoppingBag, Hotel, MapPin, Coffee, Plus,
  ShoppingCart, Users, LifeBuoy, Sparkles, Check,
  History, Trash2, Clock
} from 'lucide-react';
import { UserConfig, Session } from '../types';
import { storageService } from '../services/storageService';

interface SetupScreenProps {
  onComplete: (config: UserConfig) => void;
  onResume: (session: Session) => void;
  isLoading?: boolean;
}

const LANGUAGES = [
  "Japanese", "Spanish", "French", "German", 
  "Chinese (Mandarin)", "Portuguese", "Arabic", 
  "Korean", "Russian", "Italian", "Hindi", "Turkish"
];

const SCENARIOS = [
  { id: 'job_interview', label: 'Job Interview', icon: Briefcase, text: 'Master professional dialogue for high-stakes roles.' },
  { id: 'restaurant', label: 'Fine Dining', icon: Utensils, text: 'Order with confidence and handle menu queries.' },
  { id: 'airport', label: 'Airport Travel', icon: Plane, text: 'Check-in, security, and flight delay discussions.' },
  { id: 'doctor', label: 'Medical Visit', icon: Stethoscope, text: 'Explain symptoms and understand medical advice.' },
  { id: 'shopping', label: 'Retail Therapy', icon: ShoppingBag, text: 'Ask for sizes, colors, and handle returns.' },
  { id: 'supermarket', label: 'Supermarket', icon: ShoppingCart, text: 'Navigate aisles and queries at the checkout.' },
  { id: 'hotel', label: 'Hotel Stay', icon: Hotel, text: 'Check-in, upgrades, and concierge requests.' },
  { id: 'social', label: 'Networking', icon: Users, text: 'Small talk and introductions at social events.' },
  { id: 'service', label: 'Support', icon: LifeBuoy, text: 'Resolve issues and file complaints effectively.' },
  { id: 'directions', label: 'Navigation', icon: MapPin, text: 'Ask for and understand complex directions.' },
  { id: 'coffee', label: 'Coffee Shop', icon: Coffee, text: 'Order customized drinks like a local.' },
];

export const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete, onResume, isLoading }) => {
  const [nativeLanguage, setNativeLanguage] = useState('');
  const [selectedScenarioId, setSelectedScenarioId] = useState('');
  const [customScenario, setCustomScenario] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    setSessions(storageService.getSessions());
  }, []);

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    storageService.deleteSession(id);
    setSessions(storageService.getSessions());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalScenario = selectedScenarioId === 'custom' 
      ? customScenario 
      : SCENARIOS.find(s => s.id === selectedScenarioId)?.text || '';

    if (nativeLanguage && finalScenario) {
      onComplete({
        nativeLanguage: nativeLanguage,
        scenario: finalScenario
      });
    }
  };

  return (
    <div className="h-full w-full bg-slate-50 relative overflow-hidden flex flex-col">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-white opacity-80"></div>
      
      {/* Animated Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-200/40 rounded-full mix-blend-multiply filter blur-[80px] animate-blob"></div>
      <div className="absolute top-[10%] right-[-10%] w-[400px] h-[400px] bg-indigo-200/40 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-pink-200/40 rounded-full mix-blend-multiply filter blur-[80px] animate-blob animation-delay-4000"></div>

      <div className="relative flex-1 overflow-y-auto z-10 custom-scrollbar">
        <div className="min-h-full flex flex-col">
          
          {/* Header Section */}
          <div className="w-full max-w-5xl mx-auto pt-16 pb-8 px-4 sm:px-8 text-center animate-fadeIn shrink-0">
            {/* Custom Logo SVG */}
            <div className="flex justify-center mb-6">
              <svg width="180" height="120" viewBox="0 0 220 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xl">
                <defs>
                  <style>
                    {`.stroke-dark { stroke: #2e1065; stroke-width: 3.5; stroke-linecap: round; stroke-linejoin: round; }`}
                  </style>
                </defs>
                
                {/* Yellow Bubble (Left) */}
                <g transform="translate(10, 10)">
                  {/* Tail */}
                  <path d="M45 85 L35 105 L60 92" fill="#FCD34D" className="stroke-dark"/>
                  {/* Body */}
                  <circle cx="55" cy="55" r="45" fill="#FCD34D" className="stroke-dark"/>
                  {/* Face */}
                  <circle cx="40" cy="55" r="3.5" fill="#2e1065"/>
                  <circle cx="70" cy="55" r="3.5" fill="#2e1065"/>
                  <path d="M48 68 Q55 75 62 68" className="stroke-dark" fill="none" strokeWidth="3"/>
                  {/* Inner Bubble Icon */}
                  <g transform="translate(25, 20) scale(0.9)">
                    <path d="M2 12 Q2 2 12 2 L20 2 Q30 2 30 12 L30 18 Q30 26 20 26 L12 26 L2 32 L2 12" fill="none" stroke="#2e1065" strokeWidth="2.5"/>
                    <circle cx="10" cy="14" r="2" fill="#2e1065"/>
                    <circle cx="16" cy="14" r="2" fill="#2e1065"/>
                    <circle cx="22" cy="14" r="2" fill="#2e1065"/>
                  </g>
                </g>

                {/* Pink Bubble (Right) - Overlapping */}
                <g transform="translate(95, 10)">
                   {/* Tail */}
                   <path d="M75 85 L85 105 L60 92" fill="#F472B6" className="stroke-dark"/>
                   {/* Body */}
                   <circle cx="55" cy="55" r="45" fill="#F472B6" fillOpacity="0.95" className="stroke-dark"/>
                   {/* Face */}
                   <circle cx="35" cy="55" r="3.5" fill="#2e1065"/>
                   <circle cx="65" cy="55" r="3.5" fill="#2e1065"/>
                   {/* Mouth (Open O) */}
                   <ellipse cx="50" cy="72" rx="6" ry="5" className="stroke-dark" fill="none" strokeWidth="3"/>
                   {/* Inner Sound Icon */}
                   <g transform="translate(45, 20) scale(0.9)">
                     <path d="M2 12 Q2 2 12 2 L20 2 Q30 2 30 12 L30 18 Q30 26 20 26 L12 26 L2 32 L2 12" fill="none" stroke="#2e1065" strokeWidth="2.5"/>
                     <line x1="10" y1="10" x2="10" y2="18" stroke="#2e1065" strokeWidth="2"/>
                     <line x1="16" y1="8" x2="16" y2="20" stroke="#2e1065" strokeWidth="2"/>
                     <line x1="22" y1="11" x2="22" y2="17" stroke="#2e1065" strokeWidth="2"/>
                   </g>
                </g>
              </svg>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight mb-4 uppercase">
              Lingo<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-500">Master</span>
            </h1>
            <p className="text-sm font-bold tracking-[0.2em] text-indigo-900 uppercase mb-4 opacity-80">
              Speak Fluently. Stop Translating.
            </p>
          </div>

          {/* Content Section - Distinct styling below the line */}
          <div className="flex-1 bg-white/70 backdrop-blur-xl border-t-2 border-indigo-100 rounded-t-[3rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] animate-slideUp">
            <div className="w-full max-w-5xl mx-auto p-6 sm:p-12">
              
              {/* Recent Sessions */}
              {sessions.length > 0 && (
                <section className="mb-12 animate-slideUp" style={{ animationDelay: '0.05s' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-sm">
                      <History className="w-4 h-4" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Recent Sessions</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sessions.map((session) => (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => onResume(session)}
                        disabled={isLoading}
                        className="group relative flex flex-col p-4 rounded-2xl border border-slate-100 bg-white/40 hover:bg-white hover:border-amber-200 hover:shadow-lg transition-all duration-300 text-left"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                            <Clock className="w-4 h-4" />
                          </div>
                          <button
                            onClick={(e) => handleDeleteSession(e, session.id)}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                            title="Delete Session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="font-bold text-slate-800 truncate mb-1">
                          {session.config.scenario}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                            {session.config.nativeLanguage}
                          </span>
                          <span>•</span>
                          <span>{new Date(session.lastUpdated).toLocaleDateString()}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <form onSubmit={handleSubmit} className="space-y-12 pb-12 mt-4">
                
                {/* Step 1: Language */}
                <section className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">1</div>
                    <h2 className="text-2xl font-bold text-slate-800">Native Language</h2>
                  </div>
                  
                  <div className="glass-card rounded-2xl p-2 max-w-xl mx-auto shadow-sm hover:shadow-md transition-shadow bg-white/50">
                    <div className="relative flex items-center">
                      <Languages className="absolute left-4 w-5 h-5 text-indigo-500" />
                      <select
                        value={nativeLanguage}
                        onChange={(e) => setNativeLanguage(e.target.value)}
                        className="w-full pl-12 pr-10 py-4 bg-transparent text-lg font-semibold text-slate-700 focus:outline-none cursor-pointer appearance-none rounded-xl hover:bg-white/50 transition-colors"
                        required
                        disabled={isLoading}
                      >
                        <option value="" disabled>Select your primary language...</option>
                        {LANGUAGES.map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                        <option value="Other">Other (Type in chat)</option>
                      </select>
                      <div className="absolute right-4 pointer-events-none text-slate-400">
                        <ArrowRight className="w-5 h-5 rotate-90" />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Step 2: Scenario */}
                <section className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-sm">2</div>
                    <h2 className="text-2xl font-bold text-slate-800">Select Scenario</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {SCENARIOS.map((item, index) => {
                      const Icon = item.icon;
                      const isSelected = selectedScenarioId === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedScenarioId(item.id)}
                          disabled={isLoading}
                          style={{ animationDelay: `${0.1 + (index * 0.05)}s` }}
                          className={`group relative flex flex-col p-5 rounded-2xl border text-left transition-all duration-300 animate-slideUp
                            ${isSelected 
                              ? 'bg-white border-indigo-500 shadow-xl shadow-indigo-100 ring-1 ring-indigo-500 transform scale-[1.02]' 
                              : 'bg-white/40 border-slate-100 hover:bg-white hover:border-indigo-200 hover:shadow-lg hover:-translate-y-1'}`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl transition-colors duration-300
                              ${isSelected 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                              <Icon className="w-6 h-6" />
                            </div>
                            {isSelected && (
                              <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center animate-fadeIn">
                                <Check className="w-3.5 h-3.5 text-white" />
                              </div>
                            )}
                          </div>
                          <span className={`font-bold text-lg mb-1 ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                            {item.label}
                          </span>
                          <span className="text-sm text-slate-500 leading-snug">
                            {item.text}
                          </span>
                        </button>
                      );
                    })}
                    
                    {/* Custom Option */}
                    <button
                      type="button"
                      onClick={() => setSelectedScenarioId('custom')}
                      disabled={isLoading}
                      className={`group relative flex flex-col p-5 rounded-2xl border text-left transition-all duration-300 animate-slideUp
                        ${selectedScenarioId === 'custom'
                          ? 'bg-white border-pink-500 shadow-xl shadow-pink-100 ring-1 ring-pink-500 transform scale-[1.02]' 
                          : 'bg-white/40 border-slate-100 hover:bg-white hover:border-pink-200 hover:shadow-lg hover:-translate-y-1'}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl transition-colors duration-300
                          ${selectedScenarioId === 'custom' 
                            ? 'bg-pink-500 text-white' 
                            : 'bg-pink-50 text-pink-500 group-hover:bg-pink-500 group-hover:text-white'}`}>
                          <Plus className="w-6 h-6" />
                        </div>
                      </div>
                      <span className={`font-bold text-lg mb-1 ${selectedScenarioId === 'custom' ? 'text-pink-900' : 'text-slate-700'}`}>
                        Custom Scenario
                      </span>
                      <span className="text-sm text-slate-500 leading-snug">
                        Design your own unique roleplay situation.
                      </span>
                    </button>
                  </div>

                  {/* Custom Input */}
                  {selectedScenarioId === 'custom' && (
                    <div className="mt-6 animate-slideUp">
                      <input
                        type="text"
                        value={customScenario}
                        onChange={(e) => setCustomScenario(e.target.value)}
                        placeholder="E.g., Negotiating a salary increase..."
                        className="w-full px-6 py-4 rounded-2xl border-2 border-pink-100 bg-white text-slate-900 placeholder:text-slate-400 focus:border-pink-500 focus:outline-none focus:ring-4 focus:ring-pink-500/10 transition-all font-medium shadow-sm"
                        autoFocus
                      />
                    </div>
                  )}
                </section>

                {/* Action */}
                <div className="sticky bottom-4 pt-4 sm:static sm:pt-8 animate-slideUp" style={{ animationDelay: '0.3s' }}>
                  <button
                    type="submit"
                    disabled={isLoading || !nativeLanguage || !selectedScenarioId || (selectedScenarioId === 'custom' && !customScenario.trim())}
                    className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-xl font-bold text-white transition-all transform duration-300
                      ${isLoading || !nativeLanguage || !selectedScenarioId || (selectedScenarioId === 'custom' && !customScenario.trim())
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-pink-500 hover:from-indigo-500 hover:to-pink-400 shadow-xl shadow-indigo-500/20 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0'}`}
                  >
                    {isLoading ? (
                      <>
                        <Sparkles className="w-6 h-6 animate-spin" />
                        Preparing Session...
                      </>
                    ) : (
                      <>
                        Start Conversation <ArrowRight className="w-6 h-6" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};