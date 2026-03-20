import React, { useState } from 'react';
import { SetupScreen } from './components/SetupScreen';
import { ChatScreen } from './components/ChatScreen';
import { VocabularyMode } from './components/VocabularyMode';
import { UserConfig, AppState, Session, Message } from './types';
import { geminiService } from './services/geminiService';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [config, setConfig] = useState<UserConfig>({ nativeLanguage: '', scenario: '' });
  const [initialMessage, setInitialMessage] = useState('');
  const [initialHistory, setInitialHistory] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  React.useEffect(() => {
    const checkKey = async () => {
      const key = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!key || key === 'undefined' || key === 'null' || key === '') {
        setApiKeyMissing(true);
      } else {
        // Even if key exists, let's verify it's working
        const isWorking = await geminiService.testConnection();
        if (!isWorking) {
          setApiKeyMissing(true);
        }
      }
    };
    checkKey();
  }, []);

  const handleSetupComplete = async (userConfig: UserConfig) => {
    setConfig(userConfig);
    setIsLoading(true);
    try {
      const newSessionId = Date.now().toString();
      const startMsg = await geminiService.initializeChat(userConfig.nativeLanguage, userConfig.scenario);
      
      const initialMsg: Message = {
        id: 'init',
        role: 'model',
        text: startMsg,
        timestamp: Date.now()
      };

      const newSession: Session = {
        id: newSessionId,
        config: userConfig,
        messages: [initialMsg],
        lastUpdated: Date.now()
      };

      storageService.saveSession(newSession);
      setSessionId(newSessionId);
      setInitialMessage(startMsg);
      setInitialHistory([initialMsg]);
      setAppState(AppState.CHAT);
    } catch (error: any) {
      const errorMsg = error.message || "Failed to start session.";
      alert(`${errorMsg}\n\nTip: If you just added your API key, please wait a few seconds and try again.`);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeSession = async (session: Session) => {
    setIsLoading(true);
    try {
      await geminiService.initializeChat(
        session.config.nativeLanguage, 
        session.config.scenario, 
        session.messages
      );
      
      setConfig(session.config);
      setSessionId(session.id);
      setInitialHistory(session.messages);
      setAppState(AppState.CHAT);
    } catch (error: any) {
      alert(error.message || "Failed to resume session.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAppState(AppState.SETUP);
    setConfig({ nativeLanguage: '', scenario: '' });
    setInitialMessage('');
    setInitialHistory([]);
    setSessionId(null);
  };

  const handleUpdateSession = (messages: Message[]) => {
    if (sessionId) {
      const session = storageService.getSession(sessionId);
      if (session) {
        storageService.saveSession({
          ...session,
          messages,
          lastUpdated: Date.now()
        });
      }
    }
  };

  return (
    <div className="h-full w-full relative">
      {apiKeyMissing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-100 p-8 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Gemini API Key Required</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              To use LingoMaster, you need to add your Gemini API key as a secret.
              <br />
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-700 font-medium underline underline-offset-4"
              >
                Get a free API key here
              </a>
            </p>
            <div className="space-y-4 text-left bg-gray-50 p-6 rounded-xl border border-gray-100 mb-8">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <p className="text-sm text-gray-700">Open <strong>Settings</strong> (⚙️ gear icon, top-right corner)</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <p className="text-sm text-gray-700">Select <strong>Secrets</strong></p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <p className="text-sm text-gray-700">Add <code>GEMINI_API_KEY</code> as the secret name</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <p className="text-sm text-gray-700">Paste your API key as the value and press <strong>Enter</strong></p>
              </div>
            </div>
            <p className="text-xs text-gray-500 italic mb-6">
              The app will automatically rebuild after you add the secret.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-200"
            >
              I've added the key, refresh app
            </button>
          </div>
        </div>
      )}
      {appState === AppState.SETUP && (
        <SetupScreen 
          onComplete={handleSetupComplete} 
          onResume={handleResumeSession}
          isLoading={isLoading} 
        />
      )}
      {appState === AppState.CHAT && (
        <ChatScreen 
          config={config} 
          initialMessages={initialHistory} 
          onUpdateMessages={handleUpdateSession}
          onReset={handleReset}
          onPracticeVocabulary={() => setAppState(AppState.VOCABULARY)}
        />
      )}
      {appState === AppState.VOCABULARY && (
        <VocabularyMode 
          config={config}
          conversationHistory={initialHistory}
          onBack={() => setAppState(AppState.CHAT)}
        />
      )}
    </div>
  );
};

export default App;
