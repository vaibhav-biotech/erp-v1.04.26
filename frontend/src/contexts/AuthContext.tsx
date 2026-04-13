'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface Admin {
  _id: string;
  email: string;
}

export interface Customer {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface AuthContextType {
  // Admin
  admin: Admin | null;
  adminToken: string | null;
  adminLoading: boolean;
  adminAuthenticated: boolean;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logoutAdmin: () => void;

  // Customer
  customer: Customer | null;
  customerToken: string | null;
  customerLoading: boolean;
  customerAuthenticated: boolean;
  loginCustomer: (email: string, password: string) => Promise<void>;
  logoutCustomer: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    if (storedAdminToken && storedAdmin) {
      setAdminToken(storedAdminToken);
      setAdmin(JSON.parse(storedAdmin));
    }
    setAdminLoading(false);

    const storedCustomerToken = localStorage.getItem('customerToken');
    const storedCustomer = localStorage.getItem('customer');
    if (storedCustomerToken && storedCustomer) {
      setCustomerToken(storedCustomerToken);
      setCustomer(JSON.parse(storedCustomer));
    }
    setCustomerLoading(false);
  }, []);

  // Admin login
  const loginAdmin = useCallback(async (email: string, password: string) => {
    try {
      setAdminLoading(true);
      const response = await fetch('http://localhost:5050/api/login', {
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

  // Customer login
  const loginCustomer = useCallback(async (email: string, password: string) => {
    try {
      setCustomerLoading(true);
      const response = await fetch('http://localhost:5050/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Customer login failed');
      }

      const data = await response.json();
      
      // Handle both response formats
      const token = data.data?.token || data.token;
      const customer = data.data?.customer || data.user;
      
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

  return (
    <AuthContext.Provider
      value={{
        admin,
        adminToken,
        adminLoading,
        adminAuthenticated: !!adminToken,
        loginAdmin,
        logoutAdmin,

        customer,
        customerToken,
        customerLoading,
        customerAuthenticated: !!customerToken,
        loginCustomer,
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
