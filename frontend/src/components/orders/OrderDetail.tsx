'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Clock, Package, User, MapPin, Phone, Mail, CreditCard, ArrowLeft, Calendar } from 'lucide-react';
import { parseISTDate, formatISTDate, getTimeDifferenceMs } from '@/utils/timezone';
import { useAuth } from '@/hooks/useAuth';
import { useToastContext } from '@/app/layout';
import { apiClient } from '@/lib/api';
import { Order, OrderItem, OrderStatus } from '@/types';

interface OrderDetailProps {
  orderId: string;
}

export const OrderDetail: React.FC<OrderDetailProps> = ({ orderId }) => {
  const router = useRouter();
  const { canAccessAllOrders, user } = useAuth();
  const { success, error: showError } = useToastContext();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemainingState, setTimeRemainingState] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>(OrderStatus.PENDING);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      const orderData = await apiClient.getOrder(orderId);
      setOrder(orderData);
      setNewStatus(orderData.status);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch order details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  // State for countdown timer
  const [countdownTime, setCountdownTime] = useState<number | null>(null);

  // Calculate initial time remaining
  const calculateTimeRemaining = useCallback(() => {
    if (!order || order.status !== OrderStatus.PENDING) {
      return null;
    }
    
    // Parse order creation time as IST
    const orderCreatedAt = parseISTDate(order.created_at);
    // Get current time in IST
    const now = new Date();
    const fiveMinutesInMs = 5 * 60 * 1000;
    const elapsed = getTimeDifferenceMs(orderCreatedAt, now);
    const remaining = Math.max(0, Math.floor((fiveMinutesInMs - elapsed) / 1000));
    
    console.log('calculateTimeRemaining (IST):', {
      orderCreatedAt: formatISTDate(orderCreatedAt),
      now: formatISTDate(now),
      elapsed: elapsed + 'ms',
      elapsedMinutes: Math.floor(elapsed / 60000) + 'm ' + Math.floor((elapsed % 60000) / 1000) + 's',
      remaining: remaining + 's',
      remainingMinutes: Math.floor(remaining / 60) + 'm ' + (remaining % 60) + 's',
      orderStatus: order.status,
      createdAtRaw: order.created_at
    });
    
    return remaining;
  }, [order]);

  // Initialize countdown timer for PENDING orders
  useEffect(() => {
    console.log('useEffect triggered for countdown:', { order: order?.id, status: order?.status });
    
    if (!order || order.status !== OrderStatus.PENDING) {
      console.log('Setting countdown to null - not PENDING order');
      setCountdownTime(null);
      return;
    }

    const initialTime = calculateTimeRemaining();
    console.log('Initial countdown time calculated:', initialTime);
    
    if (initialTime === null || initialTime <= 0) {
      console.log('Order expired, checking for status update in 2 seconds');
      setCountdownTime(0);
      // Check if order status changed after expiration
      setTimeout(() => {
        fetchOrder();
      }, 2000);
      return;
    }

    console.log('Setting countdown time to:', initialTime);
    setCountdownTime(initialTime);
  }, [order, calculateTimeRemaining]);

  // Countdown timer that updates every second and triggers status check when expired
  useEffect(() => {
    if (countdownTime === null || countdownTime <= 0) return;

    const interval = setInterval(() => {
      setCountdownTime(prev => {
        if (prev === null || prev <= 1) {
          // When countdown expires, fetch order to check if status changed
          setTimeout(() => {
            console.log('Countdown expired for order', order?.id, '- fetching updated status');
            fetchOrder();
          }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [countdownTime, order?.id]);

  // Removed auto-refresh to prevent continuous page refreshing

  const handleAutoStatusUpdate = async () => {
    if (!order || order.status !== OrderStatus.PENDING) return;
    
    try {
      console.log('Auto-updating order status to PROCESSING for order:', order.id);
      const result = await apiClient.updateOrderStatus(order.id.toString(), OrderStatus.PROCESSING);
      console.log('Auto-update result:', result);
      
      // Order status updated - no refresh needed
      success('Order automatically moved to processing');
    } catch (err: any) {
      console.error('Failed to auto-update order status:', err);
      console.error('Auto-update error response:', err.response);
      
      // Auto-update failed - no refresh needed
    }
  };

  const handleManualUpdateAllPending = async () => {
    try {
      const response = await fetch('/api/background/update-pending-orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        success(`Updated ${data.updated_count} pending orders to processing`);
        await fetchOrder(); // Refresh current order
      } else {
        showError('Failed to update pending orders');
      }
    } catch (err) {
      console.error('Failed to update pending orders:', err);
      showError('Failed to update pending orders');
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    setIsUpdating(true);
    try {
      console.log('=== CANCEL ORDER TEST ===');
      console.log('Order ID:', orderId);
      console.log('User:', user);
      console.log('Order:', order);
      console.log('Auth token:', localStorage.getItem('token') ? 'Present' : 'Missing');
      
      const result = await apiClient.cancelOrder(orderId);
      console.log('Cancel order SUCCESS:', result);
      
      // Update local order state to show cancellation
      setOrder(prev => prev ? { ...prev, status: OrderStatus.CANCELLED } : null);
      success('Order cancelled successfully');
    } catch (err: any) {
      console.error('=== CANCEL ORDER ERROR ===');
      console.error('Full error:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      
      // More detailed error handling
      let errorMessage = 'Failed to cancel order';
      if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (err.response?.status === 403) {
        errorMessage = err.response.data?.detail || 'Permission denied';
      } else if (err.response?.status === 404) {
        errorMessage = 'Order not found';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      showError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!order || newStatus === order.status) return;

    setIsUpdating(true);
    try {
      await apiClient.updateOrderStatus(order.id.toString(), newStatus);
      await fetchOrder();
      success(`Order status updated to ${newStatus}`);
    } catch (err: any) {
      console.error('Update status error:', err);
      const errorMessage = err.response?.data?.detail || err.response?.data?.error || 'Failed to update order status';
      showError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
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
    return new Date(dateString).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getAvailableStatuses = (order: Order): OrderStatus[] => {
    if (!canUpdateStatus()) return [];
    
    switch (order.status) {
      case OrderStatus.PENDING:
        return [OrderStatus.PENDING, OrderStatus.PROCESSING];
      case OrderStatus.PROCESSING:
        return [OrderStatus.PROCESSING, OrderStatus.SHIPPED];
      case OrderStatus.SHIPPED:
        return [OrderStatus.SHIPPED, OrderStatus.DELIVERED];
      case OrderStatus.DELIVERED:
        return [OrderStatus.DELIVERED];
      case OrderStatus.CANCELLED:
        return [OrderStatus.CANCELLED];
      default:
        return [];
    }
  };

  const canUpdateStatus = () => canAccessAllOrders() && order && 
    ![OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(order.status);

  // Check if user can cancel order
  const canCancelOrder = useMemo(() => {
    if (!order) return false;
    
    // Vendors and admins can cancel PENDING and PROCESSING orders
    if (user?.role === 'vendor' || user?.role === 'admin') {
      return [OrderStatus.PENDING, OrderStatus.PROCESSING].includes(order.status);
    }
    
    // Customers can only cancel PENDING orders within 5 minutes
    if (user?.role === 'customer' && Number(order.user_id) === Number(user.id)) {
      // Only allow cancellation for PENDING orders within 5 minutes
      if (order.status === OrderStatus.PENDING) {
        // Parse the order creation time using IST utilities
        const orderCreatedAt = parseISTDate(order.created_at);
        const now = new Date();
        
        // Calculate 5 minutes from order creation
        const fiveMinutesInMs = 5 * 60 * 1000;
        const timeDifference = getTimeDifferenceMs(orderCreatedAt, now);
        const withinTimeLimit = timeDifference < fiveMinutesInMs;
        
        console.log('Customer PENDING cancel check (IST):', {
          orderCreatedAt: formatISTDate(orderCreatedAt),
          now: formatISTDate(now),
          timeDifference: timeDifference,
          fiveMinutesInMs: fiveMinutesInMs,
          withinTimeLimit,
          minutesElapsed: Math.floor(timeDifference / 60000)
        });
        
        return withinTimeLimit;
      }
      
      // Cannot cancel orders in any other state (PROCESSING, SHIPPED, etc.)
      return false;
    }
    
    return false;
  }, [order, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center space-x-2 px-4 py-2 border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 rounded-xl font-medium text-gray-700 hover:text-blue-700"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
            <p className="text-gray-600">Created on {formatDate(order.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Auto-update timer */}
      {order.status === OrderStatus.PENDING && countdownTime !== null && countdownTime > 0 && (
        <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="animate-pulse w-3 h-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Auto-update to Processing in{' '}
                <span className="font-mono font-bold text-lg bg-yellow-200 px-2 py-1 rounded">
                  Time remaining: {Math.floor(countdownTime / 60)}:{(countdownTime % 60).toString().padStart(2, '0')}
                </span>
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Timer based on IST timezone • Created: {new Date(order.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'medium' })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Actions */}
      {canUpdateStatus() && (
        <Card>
          <CardHeader>
            <CardTitle>Vendor Actions</CardTitle>
            <CardDescription>Update order status and manage order lifecycle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                {getAvailableStatuses(order).map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleStatusUpdate}
                disabled={isUpdating || newStatus === order.status}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isUpdating ? 'Updating...' : 'Update Status'}
              </Button>
              {user?.role === 'admin' && (
                <Button
                  onClick={handleManualUpdateAllPending}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                >
                  Update All Pending Orders
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Order Actions */}
      {user?.role === 'customer' && order?.user_id === user.id && (
        <Card>
          <CardHeader>
            <CardTitle>Order Actions</CardTitle>
            <CardDescription>
              {order?.status === OrderStatus.PENDING 
                ? 'Cancel your order (available for 5 minutes after placement)'
                : order?.status === OrderStatus.PROCESSING
                ? 'Cancel your processing order'
                : 'Order actions'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Show cancel button for PENDING orders only (customers only) */}
              {order?.status === OrderStatus.PENDING && user?.role === 'customer' && (
                <>
                  <Button
                    onClick={handleCancelOrder}
                    disabled={isUpdating}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 w-full"
                  >
                    {isUpdating ? 'Cancelling...' : 'Cancel Order'}
                  </Button>
                  
                  {/* Countdown timer for PENDING orders
                  <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    ⏰ Order will automatically move to processing in:
                    {countdownTime !== null && countdownTime > 0 ? (
                      <div className="mt-1 font-medium text-yellow-700">
                        {Math.floor(countdownTime / 60)}:{(countdownTime % 60).toString().padStart(2, '0')}
                        <div className="text-xs mt-1">Cancel now if you want to modify your order.</div>
                      </div>
                    ) : (
                      <div className="mt-1 font-medium text-red-700">
                        Processing now...
                      </div>
                    )}
                  </div> */}
                </>
              )}
              
              {/* Show expiration message for non-PENDING orders */}
              {order?.status !== OrderStatus.PENDING && order?.status !== OrderStatus.CANCELLED && user?.role === 'customer' && (
                <div className="text-sm text-gray-600 bg-red-50 p-3 rounded-lg border border-red-200">
                  ❌ Cancellation window has expired. Order will move to processing automatically.
                </div>
              )}
              
              {/* Show status for other order states */}
              {order?.status === OrderStatus.CANCELLED && (
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  ❌ This order has been cancelled.
                </div>
              )}
              
              {[OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(order?.status) && (
                <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg border border-green-200">
                  ✅ This order cannot be cancelled as it has been {order.status}.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vendor/Admin Order Actions */}
      {(user?.role === 'vendor' || user?.role === 'admin') && (
        <Card>
          <CardHeader>
            <CardTitle>Order Management</CardTitle>
            <CardDescription>Administrative order actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {canCancelOrder && (
                <Button
                  onClick={handleCancelOrder}
                  disabled={isUpdating}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
                >
                  {isUpdating ? 'Cancelling...' : 'Cancel Order'}
                </Button>
              )}
              {order?.status === OrderStatus.PENDING && (
                <Button
                  onClick={() => handleAutoStatusUpdate()}
                  disabled={isUpdating}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                >
                  {isUpdating ? 'Processing...' : 'Move to Processing'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-600" />
            <span>Customer Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Contact Details</h4>
              <p className="text-sm text-gray-600">{order.customer_name}</p>
              <p className="text-sm text-gray-600">{order.customer_email}</p>
              {order.customer_phone && (
                <p className="text-sm text-gray-600">{order.customer_phone}</p>
              )}
            </div>
            {order.shipping_address && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Shipping Address</span>
                </h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">{order.shipping_address}</p>
              </div>
            )}
          </div>
          {order.notes && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium text-gray-900 mb-2">Order Notes</h4>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-600" />
                <span>Order Items</span>
              </CardTitle>
              <CardDescription className="mt-1">
                <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {order.items_count} item{order.items_count !== 1 ? 's' : ''}
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {order.items.map((item, index) => {
              const productImage = `https://images.unsplash.com/photo-${1560472354 + index}-b33ff0c44a43?w=200&h=200&fit=crop`;
              const productColor = `bg-gradient-to-br from-${['blue', 'green', 'purple', 'orange', 'pink'][index % 5]}-500 to-${['purple', 'teal', 'blue', 'red', 'rose'][index % 5]}-600`;
              
              return (
                <div key={item.id} className="flex items-start p-6 border-2 border-gray-200 rounded-2xl hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50">
                  {/* Product Image */}
                  <div className={`w-24 h-24 ${productColor} rounded-xl overflow-hidden flex-shrink-0 mr-6`}>
                    <img
                      src={productImage}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Product Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg mb-1">{item.product_name}</h4>
                        {item.product_sku && (
                          <div className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 mb-2">
                            SKU: {item.product_sku}
                          </div>
                        )}
                        {item.product_description && (
                          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{item.product_description}</p>
                        )}
                      </div>
                      
                      {/* Pricing */}
                      <div className="text-right ml-6">
                        <div className="bg-blue-50 px-4 py-2 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">
                            {formatCurrency(item.unit_price)} × {item.quantity}
                          </p>
                          <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {formatCurrency(item.total_price)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>
          
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Order Date: {formatDate(order.created_at)}</span>
            </div>
            {order.updated_at !== order.created_at && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                <Clock className="h-4 w-4" />
                <span>Last Updated: {formatDate(order.updated_at)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
