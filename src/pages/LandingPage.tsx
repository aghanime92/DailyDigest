import React, { useState } from 'react';
import { Mail, Check, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { getGmailAuthUrl } from '../services/api';
import { useUser } from '../context/UserContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatDate } from '../utils/formatters';

export function LandingPage() {
  const { user, checkStatus, isLoading, clearUser } = useUser();
  const [email, setEmail] = useState('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const handleConnect = async () => {
    try {
      const url = await getGmailAuthUrl();
      window.location.href = url;
    } catch (error) {
      console.error('Failed to get auth URL:', error);
    }
  };

  const handleStatusCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsCheckingStatus(true);
    try {
      await checkStatus(email);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Mail className="h-6 w-6 text-[#EA4335]" />
            <h1 className="text-xl font-bold text-gray-900">Gmail Connect</h1>
          </div>
          <a href="/admin/login" className="text-sm text-gray-600 hover:text-gray-900 flex items-center">
            Admin
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden"
        >
          <div className="bg-[#4285F4] px-6 py-8 text-white text-center">
            <Mail className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Connect Your Gmail Account</h2>
            <p className="text-blue-100">
              Securely connect your Gmail account to enable email synchronization
            </p>
          </div>

          <div className="p-6">
            {user ? (
              user.connected ? (
                <div className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    {user.picture ? (
                      <img 
                        src={user.picture} 
                        alt={user.name} 
                        className="h-16 w-16 rounded-full border-2 border-green-500"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center border-2 border-green-500">
                        <Check className="h-8 w-8 text-green-500" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-1">{user.name}</h3>
                  <p className="text-gray-600 mb-4">{user.email}</p>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm text-gray-600">
                    <p className="flex justify-between border-b pb-2 mb-2">
                      <span>Connected on:</span>
                      <span className="font-medium">{formatDate(user.connectedAt)}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Token expires:</span>
                      <span className="font-medium">{formatDate(user.expiryDate)}</span>
                    </p>
                  </div>
                  
                  <Button 
                    onClick={clearUser}
                    variant="outline"
                    className="w-full"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="mb-6 text-gray-600">
                    Ready to connect <strong>{user.email}</strong> with Gmail?
                  </p>
                  <Button 
                    onClick={handleConnect}
                    className="w-full bg-[#4285F4] hover:bg-[#3367d6]"
                    disabled={isLoading}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Connect Gmail
                  </Button>
                  <button 
                    onClick={clearUser}
                    className="mt-4 text-sm text-gray-500 hover:text-gray-700"
                  >
                    Use a different email
                  </button>
                </div>
              )
            ) : (
              <form onSubmit={handleStatusCheck} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Enter your email address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                <Button 
                  type="submit"
                  className="w-full bg-[#4285F4] hover:bg-[#3367d6]"
                  disabled={isCheckingStatus || !email}
                >
                  Continue
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </main>

      <footer className="bg-white py-4 text-center text-gray-500 text-sm border-t">
        &copy; {new Date().getFullYear()} Gmail Connect Service. All rights reserved.
      </footer>
    </div>
  );
}