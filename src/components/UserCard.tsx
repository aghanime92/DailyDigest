import React from 'react';
import { RefreshCw, Trash2, Calendar, Clock } from 'lucide-react';
import { Button } from './ui/Button';
import { formatDate, formatRelativeTime } from '../utils/formatters';

interface UserCardProps {
  user: {
    id: string;
    email: string;
    name: string;
    picture?: string;
    connectedAt: string;
    expiryDate: number;
    lastSynced: string | null;
  };
  onSync: () => void;
  onRevoke: () => void;
  isSyncing: boolean;
  isRevoking: boolean;
}

export function UserCard({ user, onSync, onRevoke, isSyncing, isRevoking }: UserCardProps) {
  const isTokenExpired = Date.now() > user.expiryDate;
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-center mb-4">
          {user.picture ? (
            <img 
              src={user.picture} 
              alt={user.name}
              className="h-12 w-12 rounded-full mr-4"
            />
          ) : (
            <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-4">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-medium text-gray-900">{user.name}</h3>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-start">
            <Calendar className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
            <div>
              <p className="text-gray-500">Connected on</p>
              <p className="font-medium text-gray-700">{formatDate(user.connectedAt)}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Clock className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
            <div>
              <p className="text-gray-500">Token expiry</p>
              <p className={`font-medium ${isTokenExpired ? 'text-red-600' : 'text-gray-700'}`}>
                {formatDate(user.expiryDate)}
                {isTokenExpired && ' (Expired)'}
              </p>
            </div>
          </div>
          
          {user.lastSynced && (
            <div className="flex items-start">
              <RefreshCw className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
              <div>
                <p className="text-gray-500">Last synced</p>
                <p className="font-medium text-gray-700">{formatRelativeTime(user.lastSynced)}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onSync}
            disabled={isSyncing || isRevoking}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Inbox'}
          </Button>
          
          <Button
            variant="destructive"
            className="flex-1"
            onClick={onRevoke}
            disabled={isSyncing || isRevoking}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isRevoking ? 'Revoking...' : 'Revoke'}
          </Button>
        </div>
      </div>
    </div>
  );
}