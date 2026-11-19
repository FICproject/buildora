import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Home, ShoppingCart } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center space-y-5">
      <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-black text-slate-900">404 - Page Not Found</h1>
      <p className="text-xs text-slate-500 leading-relaxed">
        The material page or section you are looking for has been moved or does not exist.
      </p>
      <div className="flex gap-2 justify-center pt-2">
        <Button variant="primary" size="md" onClick={() => navigate('/')} leftIcon={<Home className="w-4 h-4" />}>
          Back to Homepage
        </Button>
        <Button variant="outline" size="md" onClick={() => navigate('/products')}>
          Browse Materials
        </Button>
      </div>
    </div>
  );
};
