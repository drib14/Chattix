import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import SplashScreen from './components/common/SplashScreen';
import ForwardModal from './components/modals/ForwardModal';
import DeleteModal from './components/modals/DeleteModal';
import { useState, useEffect } from 'react';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <div className="min-h-screen bg-chattix-bg flex flex-col">
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <AppRoutes />
            <ForwardModal />
            <DeleteModal />
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}
