import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { ToastContainer } from './components/common/ToastContainer';
import { initVendorRealtime, disconnectVendorRealtime } from './services/realtime';

export const App: React.FC = () => {
  useEffect(() => {
    initVendorRealtime();
    return () => disconnectVendorRealtime();
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes />
      <ToastContainer />
    </BrowserRouter>
  );
};

export default App;
