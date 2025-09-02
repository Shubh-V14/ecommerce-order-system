'use client';

import { useAuth } from '@/hooks/useAuth';
import { OrderList } from '@/components/orders/OrderList';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MyOrdersPage() {
  const { isAuthenticated, isLoading } = useAuth();
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

  if (!isAuthenticated) {
    return null;
  }

  return <OrderList showAllOrders={false} />;
}
