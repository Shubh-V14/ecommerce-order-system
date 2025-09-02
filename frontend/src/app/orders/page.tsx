'use client';

import { useAuth } from '@/hooks/useAuth';
import { OrderList } from '@/components/orders/OrderList';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AllOrdersPage() {
  const { isAuthenticated, isLoading, canAccessAllOrders } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
      } else if (!canAccessAllOrders()) {
        router.push('/orders/my');
      }
    }
  }, [isAuthenticated, isLoading, canAccessAllOrders, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !canAccessAllOrders()) {
    return null;
  }

  return <OrderList showAllOrders={true} />;
}
