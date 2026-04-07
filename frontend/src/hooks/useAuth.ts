import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for token in localStorage
    const storedToken = localStorage.getItem('authToken');
    setToken(storedToken);
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('http://localhost:5050/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login failed');
      }

      const data = await res.json();
      localStorage.setItem('authToken', data.token);
      setToken(data.token);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    router.push('/');
  };

  const isAuthenticated = !!token && !loading;

  return { token, loading, login, logout, isAuthenticated };
};
