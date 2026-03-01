import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export default function OfflineIndicator() {
  const online = useOnlineStatus();

  if (online) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-sm font-medium shadow-lg">
      Offline mode
    </div>
  );
}
