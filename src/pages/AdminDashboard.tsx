import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, Shield, LogOut, RefreshCw, 
  Trash2, Users, Clock, AlertTriangle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getConnectedUsers, 
  adminLogout, 
  syncUserEmails, 
  revokeUserConnection 
} from '../services/api';
import { Button } from '../components/ui/Button';
import { Loader } from '../components/ui/Loader';
import { UserCard } from '../components/UserCard';
import { Dialog } from '../components/ui/Dialog';
import { useToast } from '../hooks/useToast';
import { formatDate, formatRelativeTime } from '../utils/formatters';

export function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setSyncing] = useState<string | null>(null);
  const [isRevoking, setRevoking] = useState<string | null>(null);
  const [userToRevoke, setUserToRevoke] = useState<any | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const users = await getConnectedUsers();
      setUsers(users);
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        navigate('/admin/login');
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch connected users',
          variant: 'error',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [navigate, toast]);

  const handleLogout = async () => {
    try {
      await adminLogout();
      navigate('/admin/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to log out',
        variant: 'error',
      });
    }
  };

  const handleSync = async (userId: string) => {
    setSyncing(userId);
    try {
      const result = await syncUserEmails(userId);
      if (result.success) {
        toast({
          title: 'Sync successful',
          description: `Retrieved ${result.messageCount} messages. Last synced: ${formatRelativeTime(result.lastSynced)}`,
          variant: 'success',
        });
        
        // Update the user's last synced time in the local state
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, lastSynced: result.lastSynced } 
            : user
        ));
      }
    } catch (error) {
      toast({
        title: 'Sync failed',
        description: 'Failed to sync emails',
        variant: 'error',
      });
    } finally {
      setSyncing(null);
    }
  };

  const confirmRevoke = (user: any) => {
    setUserToRevoke(user);
    setShowRevokeDialog(true);
  };

  const handleRevoke = async () => {
    if (!userToRevoke) return;
    
    setRevoking(userToRevoke.id);
    setShowRevokeDialog(false);
    
    try {
      await revokeUserConnection(userToRevoke.id);
      toast({
        title: 'Connection revoked',
        description: `${userToRevoke.email} has been disconnected`,
        variant: 'success',
      });
      
      // Remove the user from the local state
      setUsers(users.filter(user => user.id !== userToRevoke.id));
    } catch (error) {
      toast({
        title: 'Revocation failed',
        description: 'Failed to revoke user connection',
        variant: 'error',
      });
    } finally {
      setRevoking(null);
      setUserToRevoke(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-gray-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6" />
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="text-white hover:bg-gray-700"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Connected Gmail Accounts</h2>
            <p className="text-gray-600 flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {users.length} {users.length === 1 ? 'user' : 'users'} connected
            </p>
          </div>
          <Button 
            variant="outline"
            onClick={fetchUsers}
            disabled={isLoading}
            className="flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader size="large" />
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No connected accounts</h3>
            <p className="text-gray-600 mb-4">
              There are no Gmail accounts connected to the service yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {users.map(user => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <UserCard
                    user={user}
                    onSync={() => handleSync(user.id)}
                    onRevoke={() => confirmRevoke(user)}
                    isSyncing={isSyncing === user.id}
                    isRevoking={isRevoking === user.id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <footer className="bg-white py-4 text-center text-gray-500 text-sm border-t">
        &copy; {new Date().getFullYear()} Gmail Connect Service. All rights reserved.
      </footer>

      <Dialog
        isOpen={showRevokeDialog}
        onClose={() => setShowRevokeDialog(false)}
        title="Revoke Gmail Connection"
      >
        <div className="p-6">
          <div className="flex items-center mb-4 text-amber-600">
            <AlertTriangle className="h-6 w-6 mr-2" />
            <h3 className="text-lg font-medium">Confirm Revocation</h3>
          </div>
          
          {userToRevoke && (
            <>
              <p className="text-gray-600 mb-4">
                Are you sure you want to revoke access for <strong>{userToRevoke.email}</strong>?
                This will disconnect their Gmail account and remove all their data from the service.
              </p>
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowRevokeDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRevoke}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Revoke Access
                </Button>
              </div>
            </>
          )}
        </div>
      </Dialog>
    </div>
  );
}