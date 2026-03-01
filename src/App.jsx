import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuthContext } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { firebaseConfigured } from '@/lib/firebase';
import LoginScreen from '@/components/LoginScreen';
import Dashboard from '@/components/Dashboard';
import Spinner from '@/components/ui/Spinner';
import OfflineIndicator from '@/components/ui/OfflineIndicator';

function SetupScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex items-center justify-center gap-2">
          <div className="px-4 py-2 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="font-display font-bold text-2xl leading-none tracking-tight">Deen</span>
          </div>
          <span className="font-display text-2xl font-semibold tracking-tight text-foreground">Tracker</span>
        </div>
        <h2 className="mb-2 text-xl font-display font-semibold">Firebase Setup Required</h2>
        <p className="mb-6 text-muted-foreground">
          Create a <code className="rounded-lg bg-secondary px-1.5 py-0.5 text-sm font-mono">.env</code> file in the project root with your Firebase config.
        </p>
        <div className="rounded-2xl bg-secondary p-4 text-left text-sm font-mono text-foreground">
          <p className="text-muted-foreground"># .env</p>
          <p>VITE_FIREBASE_API_KEY=...</p>
          <p>VITE_FIREBASE_AUTH_DOMAIN=...</p>
          <p>VITE_FIREBASE_PROJECT_ID=...</p>
          <p>VITE_FIREBASE_STORAGE_BUCKET=...</p>
          <p>VITE_FIREBASE_MESSAGING_SENDER_ID=...</p>
          <p>VITE_FIREBASE_APP_ID=...</p>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Then restart the dev server with <code className="rounded-lg bg-secondary px-1.5 py-0.5 font-mono">npm run dev</code>
        </p>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuthContext();

  if (!firebaseConfigured) return <SetupScreen />;

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

  return user ? <Dashboard /> : <LoginScreen />;
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
