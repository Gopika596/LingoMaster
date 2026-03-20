import { Session } from '../types';

const STORAGE_KEY = 'lingomaster_sessions';

export const storageService = {
  saveSession: (session: Session) => {
    try {
      const sessions = storageService.getSessions();
      const index = sessions.findIndex(s => s.id === session.id);
      
      if (index >= 0) {
        sessions[index] = { ...session, lastUpdated: Date.now() };
      } else {
        sessions.push({ ...session, lastUpdated: Date.now() });
      }
      
      // Keep only last 10 sessions to save space
      const sortedSessions = sessions.sort((a, b) => b.lastUpdated - a.lastUpdated).slice(0, 10);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sortedSessions));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  },

  getSessions: (): Session[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get sessions:', error);
      return [];
    }
  },

  getSession: (id: string): Session | null => {
    const sessions = storageService.getSessions();
    return sessions.find(s => s.id === id) || null;
  },

  deleteSession: (id: string) => {
    try {
      const sessions = storageService.getSessions();
      const filtered = sessions.filter(s => s.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }
};
