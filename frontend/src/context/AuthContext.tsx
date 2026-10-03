import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserProfile, ModelProvider } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Modals state
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  
  isKeyModalOpen: boolean;
  openKeyModal: () => void;
  closeKeyModal: () => void;
  
  isHistoryDrawerOpen: boolean;
  openHistoryDrawer: () => void;
  closeHistoryDrawer: () => void;
  
  // Model & Provider Selection
  activeProvider: ModelProvider;
  setActiveProvider: (p: ModelProvider) => void;
  activeModel: string;
  setActiveModel: (m: string) => void;

  // Runtime API keys (local cache for seamless execution)
  runtimeKeys: Record<string, string>;
  setRuntimeKey: (provider: string, key: string) => void;

  // Actions
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  loginOAuthMock: (provider: 'google' | 'apple' | 'demo') => Promise<void>;
  logout: () => void;
  saveBYOKKeys: (keys: Record<string, any>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('autolit_auth_token'));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Provider & Model State
  const [activeProvider, setActiveProvider] = useState<ModelProvider>(() => {
    return (localStorage.getItem('autolit_active_provider') as ModelProvider) || 'groq';
  });
  const [activeModel, setActiveModel] = useState<string>(() => {
    return localStorage.getItem('autolit_active_model') || 'openai/gpt-oss-20b';
  });

  // Runtime API keys state (stored in session or memory)
  const [runtimeKeys, setRuntimeKeys] = useState<Record<string, string>>(() => {
    try {
      const stored = sessionStorage.getItem('autolit_runtime_keys');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const setRuntimeKey = (provider: string, key: string) => {
    setRuntimeKeys(prev => {
      const next = { ...prev, [provider]: key };
      sessionStorage.setItem('autolit_runtime_keys', JSON.stringify(next));
      return next;
    });
  };

  const refreshProfile = useCallback(async () => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const profile = await api.getProfile(token);
      setUser(profile);
      if (profile.selected_model) {
        setActiveModel(profile.selected_model);
      }
    } catch (err) {
      console.warn('Failed to load profile, token might be expired:', err);
      // If token invalid, clear
      setToken(null);
      localStorage.removeItem('autolit_auth_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    localStorage.setItem('autolit_active_provider', activeProvider);
  }, [activeProvider]);

  useEffect(() => {
    localStorage.setItem('autolit_active_model', activeModel);
  }, [activeModel]);

  const loginWithEmail = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    localStorage.setItem('autolit_auth_token', res.access_token);
    setToken(res.access_token);
    setIsAuthModalOpen(false);
  };

  const registerWithEmail = async (email: string, pass: string, name?: string) => {
    const res = await api.register(email, pass, name);
    localStorage.setItem('autolit_auth_token', res.access_token);
    setToken(res.access_token);
    setIsAuthModalOpen(false);
  };

  const loginOAuthMock = async (provider: 'google' | 'apple' | 'demo') => {
    const res = await api.oauthMock(provider);
    localStorage.setItem('autolit_auth_token', res.access_token);
    setToken(res.access_token);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    localStorage.removeItem('autolit_auth_token');
    sessionStorage.removeItem('autolit_runtime_keys');
    setToken(null);
    setUser(null);
    setRuntimeKeys({});
  };

  const saveBYOKKeys = async (keys: Record<string, any>) => {
    if (token) {
      await api.saveKeys(token, keys);
      await refreshProfile();
    }
    // Also save in runtimeKeys
    setRuntimeKeys(prev => {
      const next = { ...prev, ...keys };
      sessionStorage.setItem('autolit_runtime_keys', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        isKeyModalOpen,
        openKeyModal: () => setIsKeyModalOpen(true),
        closeKeyModal: () => setIsKeyModalOpen(false),
        isHistoryDrawerOpen,
        openHistoryDrawer: () => setIsHistoryDrawerOpen(true),
        closeHistoryDrawer: () => setIsHistoryDrawerOpen(false),
        activeProvider,
        setActiveProvider,
        activeModel,
        setActiveModel,
        runtimeKeys,
        setRuntimeKey,
        loginWithEmail,
        registerWithEmail,
        loginOAuthMock,
        logout,
        saveBYOKKeys,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
