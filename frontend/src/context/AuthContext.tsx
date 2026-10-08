import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserProfile, ModelProvider } from '../types';

export interface OfflineProfile {
  name: string;
  username: string;
  title: string;
  avatar_color: 'sky' | 'emerald' | 'purple' | 'amber' | 'rose' | 'zinc';
  save_chat_history?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  offlineProfile: OfflineProfile;
  saveOfflineProfile: (profile: Partial<OfflineProfile>) => void;
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

  // Compatibility stubs
  loginWithEmail: (identifier: string, pass: string) => Promise<void>;
  registerWithEmail: (username: string, email: string, pass: string, name?: string) => Promise<{ status: string; email: string; message: string; dev_code?: string }>;
  verifyAccountCode: (email: string, code: string) => Promise<void>;
  resendAccountCode: (email: string) => Promise<{ status: string; message: string; dev_code?: string }>;
  logout: () => void;
  saveBYOKKeys: (keys: Record<string, any>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const DEFAULT_PROFILE: OfflineProfile = {
  name: 'Fellow Researcher',
  username: 'researcher',
  title: 'Independent Scholar',
  avatar_color: 'sky',
  save_chat_history: true
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [offlineProfile, setOfflineProfile] = useState<OfflineProfile>(() => {
    try {
      const stored = localStorage.getItem('litbuddy_offline_profile');
      if (stored) return { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
    } catch {}
    return DEFAULT_PROFILE;
  });

  const [token] = useState<string | null>('offline_desktop_token');
  const [isLoading] = useState<boolean>(false);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Provider & Model State
  const [activeProvider, setActiveProvider] = useState<ModelProvider>(() => {
    return (localStorage.getItem('autolit_active_provider') as ModelProvider) || 'groq';
  });
  const [activeModel, setActiveModel] = useState<string>(() => {
    return localStorage.getItem('autolit_active_model') || 'llama-3.1-8b-instant';
  });

  // Runtime API keys state (stored in session or localStorage)
  const [runtimeKeys, setRuntimeKeys] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('autolit_runtime_keys') || sessionStorage.getItem('autolit_runtime_keys');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const setRuntimeKey = (provider: string, key: string) => {
    setRuntimeKeys(prev => {
      const next = { ...prev, [provider]: key };
      localStorage.setItem('autolit_runtime_keys', JSON.stringify(next));
      sessionStorage.setItem('autolit_runtime_keys', JSON.stringify(next));
      return next;
    });
  };

  const saveOfflineProfile = useCallback((updates: Partial<OfflineProfile>) => {
    setOfflineProfile(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('litbuddy_offline_profile', JSON.stringify(next));
      return next;
    });
  }, []);

  const saveBYOKKeys = useCallback(async (keys: Record<string, any>) => {
    setRuntimeKeys(prev => {
      const next = { ...prev, ...keys };
      localStorage.setItem('autolit_runtime_keys', JSON.stringify(next));
      sessionStorage.setItem('autolit_runtime_keys', JSON.stringify(next));
      return next;
    });
  }, []);

  // Adapt offline profile to UserProfile interface for seamless app-wide compatibility
  const user: UserProfile = {
    id: 'offline_user',
    email: `${offlineProfile.username}@litbuddy.offline`,
    username: offlineProfile.username,
    name: offlineProfile.name,
    auth_provider: 'offline',
    selected_model: activeModel,
    theme_pref: 'dark',
    save_chat_history: offlineProfile.save_chat_history ?? true,
    contribute_public_cache: false,
    configured_keys: runtimeKeys
  };

  const refreshProfile = useCallback(async () => {}, []);
  const logout = useCallback(() => {}, []);
  const loginWithEmail = useCallback(async () => {}, []);
  const registerWithEmail = useCallback(async () => ({ status: 'verified', email: '', message: '' }), []);
  const verifyAccountCode = useCallback(async () => {}, []);
  const resendAccountCode = useCallback(async () => ({ status: 'ok', message: '' }), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        offlineProfile,
        saveOfflineProfile,
        token,
        isAuthenticated: true, // Always true for offline desktop app!
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
        verifyAccountCode,
        resendAccountCode,
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
