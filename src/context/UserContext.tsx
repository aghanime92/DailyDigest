import React, { createContext, useState, useContext, useEffect } from 'react';
import { getUserStatus } from '../services/api';

interface User {
  email: string;
  name: string;
  picture?: string;
  connected: boolean;
  connectedAt?: string;
  expiryDate?: number;
  lastSynced?: string;
}

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean;
  checkStatus: (email: string) => Promise<void>;
  clearUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check for stored email on mount
  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      checkStatus(storedEmail);
    }
  }, []);

  const checkStatus = async (email: string) => {
    setIsLoading(true);
    try {
      const status = await getUserStatus(email);
      if (status.connected) {
        setUser({
          email,
          name: status.name,
          picture: status.picture,
          connected: true,
          connectedAt: status.connectedAt,
          expiryDate: status.expiryDate,
          lastSynced: status.lastSynced
        });
        localStorage.setItem('userEmail', email);
      } else {
        setUser({
          email,
          name: '',
          connected: false
        });
        localStorage.setItem('userEmail', email);
      }
    } catch (error) {
      console.error('Error checking user status:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearUser = () => {
    setUser(null);
    localStorage.removeItem('userEmail');
  };

  return (
    <UserContext.Provider value={{ user, setUser, isLoading, checkStatus, clearUser }}>
      {children}
    </UserContext.Provider>
  );
};

const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export { UserContext, UserProvider, useUser };
export type { User };