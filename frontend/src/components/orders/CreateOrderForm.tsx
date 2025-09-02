/**
 * Create Order Form Component
 * Multi-step form for creating new orders with validation
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ProductSelector } from '@/components/ui/ProductSelector';
import { apiClient } from '@/lib/api';
import { CreateOrder, CreateOrderItem } from '@/types';

const orderItemSchema = z.object({
  product_name: z.string().min(1, 'Product name is required'),
  product_sku: z.string().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Unit price must be positive'),
  product_description: z.string().optional(),
});

const createOrderSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_email: z.string().email('Invalid email address'),
  customer_phone: z.string().optional(),
  shipping_address: z.string().min(1, 'Shipping address is required'),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
});

type CreateOrderFormData = z.infer<typeof createOrderSchema>;

export const CreateOrderForm: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateOrderFormData>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      items: [{ product_name: '', quantity: 1, unit_price: 0 }],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');

  const handleProductSelect = (product: Partial<CreateOrderItem>) => {
    const orderItem = {
      product_name: product.product_name || '',
      product_sku: product.product_sku || '',
      quantity: 1,
      unit_price: product.unit_price || 0,
      product_description: product.product_description || '',
    };
    
    if (currentItemIndex !== null) {
      update(currentItemIndex, orderItem);
    } else {
      append(orderItem);
    }
    setShowProductSelector(false);
    setCurrentItemIndex(null);
  };

  const openProductSelector = (index?: number) => {
    setCurrentItemIndex(index ?? null);
    setShowProductSelector(true);
  };

  const calculateTotal = () => {
    return watchedItems.reduce((total, item) => {
      return total + (item.quantity || 0) * (item.unit_price || 0);
    }, 0);
  };

  const onSubmit = async (data: CreateOrderFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const orderData: CreateOrder = {
        ...data,
        items: data.items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
        })),
      };

      const createdOrder = await apiClient.createOrder(orderData);
      router.push(`/orders/${createdOrder.id}`);
    } catch (error: any) {
      setSubmitError(error.response?.data?.error || 'Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
        <p className="text-gray-600">Fill in the details to create a new order.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Enter the customer details for this order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                {...register('customer_name')}
                label="Customer Name"
                placeholder="Enter customer name"
                error={errors.customer_name?.message}
              />
              <Input
                {...register('customer_email')}
                label="Customer Email"
                type="email"
                placeholder="Enter customer email"
                error={errors.customer_email?.message}
              />
            </div>
            <Input
              {...register('customer_phone')}
              label="Customer Phone (Optional)"
              type="tel"
              placeholder="Enter customer phone"
              error={errors.customer_phone?.message}
            />
            <Input
              {...register('shipping_address')}
              label="Shipping Address"
              placeholder="Enter complete shipping address"
              error={errors.shipping_address?.message}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Notes (Optional)
              </label>
              <textarea
                {...register('notes')}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={3}
                placeholder="Any special instructions or notes"
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
            <CardDescription>Add products to this order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-6 border border-gray-200 rounded-lg space-y-4 bg-gray-50">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-lg">Item {index + 1}</h4>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => openProductSelector(index)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 border-0"
                    >
                      🛍️ Select Product
                    </Button>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    {...register(`items.${index}.product_name`)}
                    label="Product Name"
                    placeholder="Enter product name"
                    error={errors.items?.[index]?.product_name?.message}
                  />
                  <Input
                    {...register(`items.${index}.product_sku`)}
                    label="Product SKU (Optional)"
                    placeholder="Enter product SKU"
                    error={errors.items?.[index]?.product_sku?.message}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    label="Quantity"
                    type="number"
                    min="1"
                    placeholder="Enter quantity"
                    error={errors.items?.[index]?.quantity?.message}
                  />
                  <Input
                    {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                    label="Unit Price ($)"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter unit price"
                    error={errors.items?.[index]?.unit_price?.message}
                  />
                </div>
                
                <Input
                  {...register(`items.${index}.product_description`)}
                  label="Product Description (Optional)"
                  placeholder="Enter product description"
                  error={errors.items?.[index]?.product_description?.message}
                />
                
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    Item Total: {formatCurrency((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unit_price || 0))}
                  </p>
                </div>
              </div>
            ))}
            
            <div className="flex space-x-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => openProductSelector()}
                className="bg-gradient-to-r from-green-500 to-teal-600 text-white hover:from-green-600 hover:to-teal-700 border-0 flex items-center space-x-2"
              >
                <span>📦</span>
                <span>Add Product from Catalog</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ product_name: '', quantity: 1, unit_price: 0 })}
              >
                Add Manual Item
              </Button>
            </div>
            
            {errors.items && (
              <p className="text-sm text-red-600">{errors.items.message}</p>
            )}
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
                <span>Total Items:</span>
                <span>{watchedItems.reduce((sum, item) => sum + (item.quantity || 0), 0)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount:</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {submitError && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{submitError}</div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            ← Back to Dashboard
          </Button>
          <div className="flex space-x-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/dashboard')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Order...' : 'Create Order'}
            </Button>
          </div>
        </div>
      </form>

      {/* Product Selector Modal */}
      <ProductSelector
        isOpen={showProductSelector}
        onSelectProduct={handleProductSelect}
        onClose={() => {
          setShowProductSelector(false);
          setCurrentItemIndex(null);
        }}
      />
    </div>
  );
};
