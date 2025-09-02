'use client';

import { useAuth } from '@/hooks/useAuth';
import { CustomerDashboard } from '@/components/dashboard/CustomerDashboard';
import { VendorDashboard } from '@/components/dashboard/VendorDashboard';
import { UserRole } from '@/types';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Render role-specific dashboard
  switch (user.role) {
    case UserRole.CUSTOMER:
      return <CustomerDashboard />;
    case UserRole.VENDOR:
    case UserRole.ADMIN:
      return <VendorDashboard />;
    default:
      return <CustomerDashboard />;
  }
}
