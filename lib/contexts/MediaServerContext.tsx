import { authenticateAndSaveServer } from '@/services/jellyfin';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { storage } from '../storage';

export interface MediaServerInfo {
  id: string;
  address: string;
  name: string;
  userId: string;
  username: string;
  userAvatar: string;
  accessToken: string;
  createdAt: number;
}

interface MediaServerContextType {
  servers: MediaServerInfo[];
  currentServer: MediaServerInfo | null;
  setCurrentServer: (server: MediaServerInfo) => void;
  isInitialized: boolean;
  addServer: (server: Omit<MediaServerInfo, 'id' | 'createdAt'>) => Promise<void>;
  authenticateAndAddServer: (address: string, username: string, password: string) => Promise<void>;
  removeServer: (id: string) => Promise<void>;
  updateServer: (id: string, updates: Partial<MediaServerInfo>) => Promise<void>;
  getServer: (id: string) => MediaServerInfo | undefined;
  getServerByAddress: (address: string) => MediaServerInfo | undefined;
  refreshServerInfo: (id: string) => Promise<void>;
}

const MediaServerContext = createContext<MediaServerContextType | undefined>(undefined);

const STORAGE_KEY = 'nekofin_servers';

function normalizeServerAddress(address: string): string {
  return address.replace(/\/$/, '');
}

export function MediaServerProvider({ children }: { children: React.ReactNode }) {
  const [servers, setServers] = useState<MediaServerInfo[]>([]);
  const [currentServerId, setCurrentServerId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    loadServers();
  }, []);

  const currentServer = useMemo(() => {
    return servers.find((server) => server.id === currentServerId) || null;
  }, [servers, currentServerId]);

  const setCurrentServer = (server: MediaServerInfo) => {
    setCurrentServerId(server.id);
  };

  const loadServers = async () => {
    try {
      const stored = storage.getString(STORAGE_KEY);
      if (stored) {
        const parsedServers = JSON.parse(stored) as MediaServerInfo[];
        const normalizedServers = parsedServers.map((server) => ({
          ...server,
          address: normalizeServerAddress(server.address),
        }));
        setServers(normalizedServers);
        if (normalizedServers.length > 0) {
          setCurrentServerId(normalizedServers[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load servers:', error);
    } finally {
      setIsInitialized(true);
    }
  };

  const saveServers = async (newServers: MediaServerInfo[]) => {
    try {
      storage.set(STORAGE_KEY, JSON.stringify(newServers));
      setServers(newServers);
    } catch (error) {
      console.error('Failed to save servers:', error);
    }
  };

  const addServer = async (server: Omit<MediaServerInfo, 'id' | 'createdAt'>) => {
    const normalizedAddress = normalizeServerAddress(server.address);
    const newServer: MediaServerInfo = {
      ...server,
      address: normalizedAddress,
      id: `${normalizedAddress}_${server.userId}_${Date.now()}`,
      createdAt: Date.now(),
    };

    const updatedServers = [...servers, newServer];
    await saveServers(updatedServers);
  };

  const authenticateAndAddServer = async (address: string, username: string, password: string) => {
    const normalizedAddress = normalizeServerAddress(address);
    await authenticateAndSaveServer(normalizedAddress, username, password, addServer);
  };

  const removeServer = async (id: string) => {
    const updatedServers = servers.filter((server) => server.id !== id);
    await saveServers(updatedServers);
  };

  const updateServer = async (id: string, updates: Partial<MediaServerInfo>) => {
    const updatedServers = servers.map((server) =>
      server.id === id
        ? {
            ...server,
            ...updates,
            address: updates.address ? normalizeServerAddress(updates.address) : server.address,
          }
        : server,
    );
    await saveServers(updatedServers);
  };

  const getServer = (id: string) => {
    return servers.find((server) => server.id === id);
  };

  const getServerByAddress = (address: string) => {
    const normalizedAddress = normalizeServerAddress(address);
    return servers.find((server) => server.address === normalizedAddress);
  };

  const refreshServerInfo = async (id: string) => {
    const server = servers.find((s) => s.id === id);
    if (!server) return;
    try {
      const { createApiFromServerInfo, getUserInfo, getSystemInfo } = await import(
        '@/services/jellyfin'
      );
      const api = createApiFromServerInfo(server);
      const sysRes = await getSystemInfo(api);
      const system = sysRes.data;
      const userRes = await getUserInfo(api, server.userId);
      const user = userRes.data;
      await updateServer(id, {
        name: system.ServerName || user.ServerName || server.address,
        username: user.Name || server.username,
        userAvatar: `${server.address}/Users/${user.Id}/Images/Primary?quality=90`,
      });
    } catch (error) {
      console.error('Failed to refresh server info:', error);
    }
  };

  const value: MediaServerContextType = {
    servers,
    currentServer,
    setCurrentServer,
    isInitialized,
    addServer,
    authenticateAndAddServer,
    removeServer,
    updateServer,
    getServer,
    getServerByAddress,
    refreshServerInfo,
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
