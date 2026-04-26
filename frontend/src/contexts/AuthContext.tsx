'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getApiHeaders, buildApiUrl } from '@/lib/storeConfig';

export interface Admin {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: 'super_admin' | 'store_admin';
  storeName?: string | null;
  canAccessAllStores?: boolean;
}

export interface Customer {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  store: string;
}

interface AuthContextType {
  // Admin
  admin: Admin | null;
  adminToken: string | null;
  adminLoading: boolean;
  adminAuthenticated: boolean;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logoutAdmin: () => void;
  logout: () => void;

  // Customer
  customer: Customer | null;
  customerToken: string | null;
  customerLoading: boolean;
  customerAuthenticated: boolean;
  loginCustomer: (email: string, password: string) => Promise<void>;
  registerCustomer: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }) => Promise<void>;
  logoutCustomer: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const safeParseStorageItem = <T,>(value: string | null): T | null => {
  if (!value || value === 'undefined' || value === 'null') {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Admin state
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(true);

  // Customer state
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerToken, setCustomerToken] = useState<string | null>(null);
  const [customerLoading, setCustomerLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const storedAdminToken = localStorage.getItem('adminToken');
    const storedAdmin = localStorage.getItem('admin');
    const parsedAdmin = safeParseStorageItem<Admin>(storedAdmin);
    if (storedAdminToken && parsedAdmin) {
      setAdminToken(storedAdminToken);
      setAdmin(parsedAdmin);
    } else if (storedAdmin === 'undefined' || storedAdmin === 'null') {
      localStorage.removeItem('admin');
      localStorage.removeItem('adminToken');
    }
    setAdminLoading(false);

    const storedCustomerToken = localStorage.getItem('customerToken');
    const storedCustomer = localStorage.getItem('customer');
    const parsedCustomer = safeParseStorageItem<Customer>(storedCustomer);
    if (storedCustomerToken && parsedCustomer) {
      setCustomerToken(storedCustomerToken);
      setCustomer(parsedCustomer);
    } else if (storedCustomer === 'undefined' || storedCustomer === 'null') {
      localStorage.removeItem('customer');
      localStorage.removeItem('customerToken');
    }
    setCustomerLoading(false);
  }, []);

  // Admin login
  const loginAdmin = useCallback(async (email: string, password: string) => {
    try {
      setAdminLoading(true);
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';
      const response = await fetch(`${baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Admin login failed');
      }

      const data = await response.json();
      setAdminToken(data.data.token);
      setAdmin(data.data.admin);

      localStorage.setItem('adminToken', data.data.token);
      localStorage.setItem('admin', JSON.stringify(data.data.admin));
    } catch (error) {
      throw error;
    } finally {
      setAdminLoading(false);
    }
  }, []);

  // Admin logout
  const logoutAdmin = useCallback(() => {
    setAdmin(null);
    setAdminToken(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
  }, []);

  // Customer login - PLAIN TEXT PASSWORD
  const loginCustomer = useCallback(async (email: string, password: string) => {
    try {
      setCustomerLoading(true);
      
      const headers = getApiHeaders();
      
      const response = await fetch(buildApiUrl('/api/auth/login'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      const token = data.data?.token || data.token;
      const customer = data.data?.customer || data.customer || data.user;

      if (!token || !customer) {
        throw new Error('Invalid login response from server');
      }
      
      setCustomerToken(token);
      setCustomer(customer);

      localStorage.setItem('customerToken', token);
      localStorage.setItem('customer', JSON.stringify(customer));
    } catch (error) {
      throw error;
    } finally {
      setCustomerLoading(false);
    }
  }, []);

  // Customer register - PLAIN TEXT PASSWORD
  const registerCustomer = useCallback(async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }) => {
    try {
      setCustomerLoading(true);
      
      const headers = getApiHeaders();

      const response = await fetch(buildApiUrl('/api/auth/signup'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const data = await response.json();
      const token = data.data?.token || data.token;
      const customer = data.data?.customer || data.customer || data.user;

      if (!token || !customer) {
        throw new Error('Invalid signup response from server');
      }
      
      setCustomerToken(token);
      setCustomer(customer);

      localStorage.setItem('customerToken', token);
      localStorage.setItem('customer', JSON.stringify(customer));
    } catch (error) {
      throw error;
    } finally {
      setCustomerLoading(false);
    }
  }, []);

  // Customer logout
  const logoutCustomer = useCallback(() => {
    setCustomer(null);
    setCustomerToken(null);
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customer');
  }, []);

  // Generic logout
  const logout = useCallback(() => {
    logoutAdmin();
    logoutCustomer();
  }, [logoutAdmin, logoutCustomer]);

  return (
    <AuthContext.Provider
      value={{
        admin,
        adminToken,
        adminLoading,
        adminAuthenticated: !!adminToken,
        loginAdmin,
        logoutAdmin,
        logout,

        customer,
        customerToken,
        customerLoading,
        customerAuthenticated: !!customerToken,
        loginCustomer,
        registerCustomer,
        logoutCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
