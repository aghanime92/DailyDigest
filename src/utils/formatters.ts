import { formatDistance } from '../utils/relativeTime';

export function formatDate(timestamp: string | number | undefined): string {
  if (!timestamp) return 'N/A';
  
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatRelativeTime(timestamp: string | null): string {
  if (!timestamp) return 'Never';
  
  return formatDistance(new Date(timestamp), new Date());
}