import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../components/layout/Logo.jsx';
import { Button } from '../components/primitives/Button.jsx';

export function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg text-text p-6">
      <Logo size={36} />
      <div className="ff-mono text-2xl text-muted mt-6 mb-1">404</div>
      <h1 className="text-xl font-semibold tracking-tightish">Page not found</h1>
      <p className="text-sm text-muted mt-1 max-w-sm text-center">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/dashboard" className="mt-5">
        <Button variant="primary" leftIcon={<ArrowLeft size={14} />}>
          Back to dashboard
        </Button>
      </Link>
    </div>
  );
}
