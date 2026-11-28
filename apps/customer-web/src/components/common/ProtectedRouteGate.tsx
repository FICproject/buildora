import React, { useEffect } from 'react';
import { Lock, Smartphone } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../ui/Button';

interface ProtectedRouteGateProps {
  title: string;
  description: string;
  reason?: string;
  children: React.ReactNode;
}

export const ProtectedRouteGate: React.FC<ProtectedRouteGateProps> = ({
  title,
  description,
  reason,
  children,
}) => {
  const location = useLocation();
  const { isAuthenticated, openAuthModal } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal(location.pathname + location.search, reason || description);
    }
  }, [isAuthenticated, location.pathname, location.search, openAuthModal, reason, description]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-brand-blue-50 border border-brand-blue-100 text-brand-blue-900 flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">{title}</h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            {description}
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => openAuthModal(location.pathname + location.search, reason || description)}
          leftIcon={<Smartphone className="w-4 h-4" />}
          className="font-bold shadow-md"
        >
          Sign In with Mobile OTP
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};
