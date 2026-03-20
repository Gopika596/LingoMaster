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
      alert(error.message || "Failed to start session. Please check your API key or connection.");
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
