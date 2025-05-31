import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail } from 'lucide-react';
import { adminLogin, getConnectedUsers } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../hooks/useToast';

export function AdminLoginPage() {
  const [secretKey, setSecretKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getConnectedUsers();
        setIsAuthenticated(true);
        navigate('/admin/dashboard');
      } catch (error) {
        // Not authenticated, stay on login page
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!secretKey) return;
    
    setIsLoading(true);
    try {
      await adminLogin(secretKey);
      toast({
        title: 'Login successful',
        description: 'You are now logged in as admin',
        variant: 'success'
      });
      navigate('/admin/dashboard');
    } catch (error) {
      toast({
        title: 'Login failed',
        description: 'Invalid secret key',
        variant: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Mail className="h-6 w-6 text-[#EA4335]" />
            <h1 className="text-xl font-bold text-gray-900">Gmail Connect</h1>
          </div>
          <a href="/" className="text-sm text-gray-600 hover:text-gray-900">Back to Home</a>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden"
        >
          <div className="bg-gray-800 px-6 py-8 text-white text-center">
            <Shield className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Admin Login</h2>
            <p className="text-gray-300">
              Enter your secret key to access the admin dashboard
            </p>
          </div>

          <div className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="secretKey" className="block text-sm font-medium text-gray-700 mb-1">
                  Secret Key
                </label>
                <Input
                  id="secretKey"
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter your admin secret key"
                  required
                  className="w-full"
                />
              </div>
              <Button 
                type="submit"
                className="w-full bg-gray-800 hover:bg-gray-700"
                disabled={isLoading}
              >
                {isLoading ? 'Authenticating...' : 'Login'}
              </Button>
            </form>
          </div>
        </motion.div>
      </main>

      <footer className="bg-white py-4 text-center text-gray-500 text-sm border-t">
        &copy; {new Date().getFullYear()} Gmail Connect Service. All rights reserved.
      </footer>
    </div>
  );
}