import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './routes';
import { initCustomerRealtime, disconnectCustomerRealtime } from './services/realtime';
import { useStoreConfigStore } from './store/useStoreConfigStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  useEffect(() => {
    void useStoreConfigStore.getState().loadConfig(true);
    initCustomerRealtime(queryClient);
    return () => disconnectCustomerRealtime();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
};

export default App;
