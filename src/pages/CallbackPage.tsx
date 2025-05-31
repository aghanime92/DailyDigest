import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { handleGmailCallback } from '../services/api';
import { useUser } from '../context/UserContext';
import { Loader } from '../components/ui/Loader';
import { useToast } from '../hooks/useToast';

export function CallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useUser();
  const [isProcessing, setIsProcessing] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        // Get the authorization code from URL
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        
        if (!code) {
          throw new Error('No authorization code found');
        }
        
        // Exchange code for tokens
        const result = await handleGmailCallback(code);
        
        if (result.success) {
          // Update user context
          setUser({
            email: result.user.email,
            name: result.user.name,
            connected: true
          });
          
          toast({
            title: 'Successfully connected',
            description: `Gmail account ${result.user.email} has been connected.`,
            variant: 'success',
          });
          
          // Redirect to landing page
          navigate('/', { replace: true });
        } else {
          throw new Error('Failed to connect Gmail account');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        toast({
          title: 'Connection failed',
          description: 'There was a problem connecting your Gmail account. Please try again.',
          variant: 'error',
        });
        navigate('/', { replace: true });
      } finally {
        setIsProcessing(false);
      }
    };
    
    processOAuthCallback();
  }, [location, navigate, setUser, toast]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <Loader size="large" className="mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          {isProcessing ? 'Connecting your Gmail account...' : 'Redirecting...'}
        </h1>
        <p className="text-gray-600">
          Please wait while we securely process your authorization.
        </p>
      </div>
    </div>
  );
}