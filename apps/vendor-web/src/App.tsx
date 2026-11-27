import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { ToastContainer } from './components/common/ToastContainer';
import { initVendorRealtime, disconnectVendorRealtime } from './services/realtime';
import { useVendorAuthStore } from './store/useVendorAuthStore';

export const App: React.FC = () => {
  const token = useVendorAuthStore((s) => s.token);

  useEffect(() => {
    if (token) {
      initVendorRealtime();
    } else {
      disconnectVendorRealtime();
    }
    return () => disconnectVendorRealtime();
  }, [token]);

  return (
    <BrowserRouter>
      <AppRoutes />
      <ToastContainer />
    </BrowserRouter>
  );
};

export default App;
