import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuthContext } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Dashboard from '@/components/Dashboard';
import Spinner from '@/components/ui/Spinner';
import OfflineIndicator from '@/components/ui/OfflineIndicator';

function AppContent() {
  const { loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Spinner className="mb-4" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
        <OfflineIndicator />
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 2000,
            style: {
              borderRadius: '16px',
              background: 'hsl(20 8% 16%)',
              color: 'hsl(40 20% 94%)',
              fontSize: '14px',
              fontFamily: 'var(--font-sans)',
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}
