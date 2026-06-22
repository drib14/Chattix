import { useState, useEffect } from 'react';
import { useSignIn, useClerk, SignedIn, SignedOut } from '@clerk/clerk-react';
import SavedAccountsView from './components/SavedAccountsView';
import SplashScreen from './components/SplashScreen';
import SkeletalLoader from './components/SkeletalLoader';
import Dashboard from './components/Dashboard';

export default function App() {
  const { signIn, isLoaded } = useSignIn();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash screen for at least 2 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleStandardSignIn = () => {
    signIn.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/',
      redirectUrlComplete: '/',
    });
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  if (!isLoaded) {
    return <SkeletalLoader />;
  }

  return (
    <div className="min-h-screen bg-chattix-bg flex flex-col">
      <SignedOut>
        <SavedAccountsView onContinueNew={handleStandardSignIn} />
      </SignedOut>

      <SignedIn>
        <Dashboard />
      </SignedIn>
    </div>
  );
}
