/**
 * Order List Component
 * Displays orders with filtering, sorting, and pagination
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiClient } from '@/lib/api';
import { Order, OrderStatus, PaginatedResponse } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface OrderListProps {
  showAllOrders?: boolean;
}

export const OrderList: React.FC<OrderListProps> = ({ showAllOrders = false }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canAccessAllOrders } = useAuth();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    size: 10,
    total: 0,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Get initial filter from URL params
  useEffect(() => {
    const status = searchParams.get('status') as OrderStatus;
    if (status && Object.values(OrderStatus).includes(status)) {
      setStatusFilter(status);
    }
  }, [searchParams]);

  const fetchOrders = async (page: number = 1, status?: OrderStatus) => {
    try {
      setIsLoading(true);
      
      let response: PaginatedResponse<Order>;
      if (showAllOrders && canAccessAllOrders()) {
        response = await apiClient.getAllOrders(page, pagination.size, status || undefined);
      } else {
        response = await apiClient.getMyOrders(page, pagination.size, status || undefined);
      }
      
      setOrders(response.items);
      setPagination({
        page: response.page,
        size: response.size,
        total: response.total,
        pages: response.pages,
      });
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1, statusFilter || undefined);
  }, [statusFilter, showAllOrders]);

  const handleStatusFilter = (status: OrderStatus | '') => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchOrders(newPage, statusFilter || undefined);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg';
      case OrderStatus.PROCESSING:
        return 'bg-gradient-to-r from-purple-400 to-purple-600 text-white shadow-lg';
      case OrderStatus.SHIPPED:
        return 'bg-gradient-to-r from-indigo-400 to-indigo-600 text-white shadow-lg';
      case OrderStatus.DELIVERED:
        return 'bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg';
      case OrderStatus.CANCELLED:
        return 'bg-gradient-to-r from-red-400 to-red-600 text-white shadow-lg';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white shadow-lg';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      order.id.toString().includes(searchLower) ||
      order.customer_name.toLowerCase().includes(searchLower) ||
      order.customer_email.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            ← Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {showAllOrders ? 'All Orders' : 'My Orders'}
            </h1>
            <p className="text-gray-600">
              {showAllOrders ? 'Manage all customer orders' : 'View and track your orders'}
            </p>
          </div>
        </div>
        {!showAllOrders && (
          <Button onClick={() => router.push('/orders/create')}>
            + Create Order
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by order ID, customer name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value as OrderStatus | '')}
                className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <option value="">All Status</option>
                {Object.values(OrderStatus).map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <span>Orders ({pagination.total})</span>
              </CardTitle>
              <CardDescription className="mt-1">
                {statusFilter ? (
                  <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    Filtered by: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                  </span>
                ) : (
                  <span>All your orders in one place</span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {searchTerm || statusFilter ? 'No orders match your filters' : 'No orders found'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || statusFilter ? 'Try adjusting your search criteria' : 'Get started by creating your first order'}
              </p>
              {!showAllOrders && (
                <Button 
                  onClick={() => router.push('/orders/create')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  Create Your First Order
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order, index) => {
                // Use first product image if available, otherwise fallback to placeholder
                const firstProduct = order.items?.[0];
                const orderImage = firstProduct?.product_image || '/api/placeholder/100/100';
                const orderColor = `bg-gradient-to-br from-${['blue', 'green', 'purple', 'orange', 'pink', 'indigo', 'teal'][order.id % 7]}-500 to-${['purple', 'teal', 'blue', 'red', 'rose', 'blue', 'green'][order.id % 7]}-600`;
                
                return (
                  <div
                    key={order.id}
                    className="group relative p-6 border-2 border-gray-200 rounded-2xl hover:shadow-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] bg-gradient-to-r from-white to-gray-50"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <div className="flex items-center space-x-6">
                      {/* Order Visual */}
                      <div className={`w-16 h-16 ${orderColor} rounded-xl overflow-hidden flex-shrink-0 shadow-lg relative`}>
                        {firstProduct?.product_image ? (
                          <img
                            src={orderImage}
                            alt={firstProduct.product_name || `Order #${order.id}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`${firstProduct?.product_image ? 'hidden' : ''} absolute inset-0 flex items-center justify-center text-white font-bold text-lg`}>
                          #{order.id}
                        </div>
                      </div>
                      
                      {/* Order Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                                Order #{order.id}
                              </h3>
                              <span className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm ${getStatusColor(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-700">
                                {order.customer_name} • {order.customer_email}
                              </p>
                              <p className="text-xs text-gray-500">
                                Created: {formatDate(order.created_at)}
                              </p>
                              {order.tracking_number && (
                                <div className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                  📦 {order.tracking_number}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Order Summary */}
                          <div className="text-right">
                            <div className="bg-gradient-to-r from-green-50 to-teal-50 px-4 py-3 rounded-xl border border-green-200">
                              <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                                {formatCurrency(order.total_amount)}
                              </p>
                              <p className="text-sm text-gray-600 font-medium">
                                {order.items_count} item{order.items_count !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Hover Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.size) + 1} to{' '}
                {Math.min(pagination.page * pagination.size, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 py-1 text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
