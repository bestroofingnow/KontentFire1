import { ReactNode } from 'react';
import { AuthProvider } from '@/hooks/use-auth';

// A simple wrapper component that provides the AuthProvider context
export function AuthProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}