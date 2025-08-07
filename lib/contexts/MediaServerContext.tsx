import { authenticateAndSaveServer } from '@/services/jellyfin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface MediaServerInfo {
  id: string;
  address: string;
  name: string;
  userId: string;
  username: string;
  accessToken: string;
  createdAt: number;
}

interface MediaServerContextType {
  servers: MediaServerInfo[];
  addServer: (server: Omit<MediaServerInfo, 'id' | 'createdAt'>) => Promise<void>;
  authenticateAndAddServer: (address: string, username: string, password: string) => Promise<void>;
  removeServer: (id: string) => Promise<void>;
  updateServer: (id: string, updates: Partial<MediaServerInfo>) => Promise<void>;
  getServer: (id: string) => MediaServerInfo | undefined;
  getServerByAddress: (address: string) => MediaServerInfo | undefined;
}

const MediaServerContext = createContext<MediaServerContextType | undefined>(undefined);

const STORAGE_KEY = 'nekofin_servers';

export function MediaServerProvider({ children }: { children: React.ReactNode }) {
  const [servers, setServers] = useState<MediaServerInfo[]>([]);

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedServers = JSON.parse(stored);
        setServers(parsedServers);
      }
    } catch (error) {
      console.error('Failed to load servers:', error);
    }
  };

  const saveServers = async (newServers: MediaServerInfo[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newServers));
      setServers(newServers);
    } catch (error) {
      console.error('Failed to save servers:', error);
    }
  };

  const addServer = async (server: Omit<MediaServerInfo, 'id' | 'createdAt'>) => {
    const newServer: MediaServerInfo = {
      ...server,
      id: `${server.address}_${server.userId}_${Date.now()}`,
      createdAt: Date.now(),
    };

    const updatedServers = [...servers, newServer];
    await saveServers(updatedServers);
  };

  const authenticateAndAddServer = async (address: string, username: string, password: string) => {
    await authenticateAndSaveServer(address, username, password, addServer);
  };

  const removeServer = async (id: string) => {
    const updatedServers = servers.filter((server) => server.id !== id);
    await saveServers(updatedServers);
  };

  const updateServer = async (id: string, updates: Partial<MediaServerInfo>) => {
    const updatedServers = servers.map((server) =>
      server.id === id ? { ...server, ...updates } : server,
    );
    await saveServers(updatedServers);
  };

  const getServer = (id: string) => {
    return servers.find((server) => server.id === id);
  };

  const getServerByAddress = (address: string) => {
    return servers.find((server) => server.address === address);
  };

  const value: MediaServerContextType = {
    servers,
    addServer,
    authenticateAndAddServer,
    removeServer,
    updateServer,
    getServer,
    getServerByAddress,
  };

  return <MediaServerContext.Provider value={value}>{children}</MediaServerContext.Provider>;
}

export function useMediaServers() {
  const context = useContext(MediaServerContext);
  if (context === undefined) {
    throw new Error('useServers must be used within a MediaServerProvider');
  }
  return context;
}
