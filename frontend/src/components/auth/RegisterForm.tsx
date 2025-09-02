/**
 * Register Form Component
 * Professional registration form with role selection and validation
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { RegisterData, UserRole } from '@/types';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  full_name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.nativeEnum(UserRole),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterForm: React.FC = () => {
  const router = useRouter();
  const { register: registerUser, isLoading, error } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: UserRole.CUSTOMER,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setSubmitError(null);
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData as RegisterData);
      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (error: any) {
      setSubmitError(error.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Registration Successful!</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Your account has been created. Redirecting to login...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-center text-2xl font-bold">
              Create your account
            </CardTitle>
            <CardDescription className="text-center">
              Sign up to access the order management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                {...register('username')}
                label="Username"
                type="text"
                placeholder="Choose a username"
                error={errors.username?.message}
                autoComplete="username"
              />

              <Input
                {...register('email')}
                label="Email"
                type="email"
                placeholder="Enter your email"
                error={errors.email?.message}
                autoComplete="email"
              />

              <Input
                {...register('password')}
                label="Password"
                type="password"
                placeholder="Create a password"
                error={errors.password?.message}
                autoComplete="new-password"
              />

              <Input
                {...register('confirmPassword')}
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                error={errors.confirmPassword?.message}
                autoComplete="new-password"
              />

              <Input
                {...register('full_name')}
                label="Full Name (Optional)"
                type="text"
                placeholder="Enter your full name"
                error={errors.full_name?.message}
                autoComplete="name"
              />

              <Input
                {...register('phone')}
                label="Phone (Optional)"
                type="tel"
                placeholder="Enter your phone number"
                error={errors.phone?.message}
                autoComplete="tel"
              />

              <Input
                {...register('address')}
                label="Address (Optional)"
                type="text"
                placeholder="Enter your address"
                error={errors.address?.message}
                autoComplete="address-line1"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type
                </label>
                <select
                  {...register('role')}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <option value={UserRole.CUSTOMER}>Customer</option>
                  <option value={UserRole.VENDOR}>Vendor</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>

              {(submitError || error) && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">
                    {submitError || error}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => router.push('/auth/login')}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
