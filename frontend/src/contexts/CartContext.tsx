'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  sizeVariant: {
    id: string;
    name: string;
    price: number;
  };
  potVariant: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
  totalPrice: number;
  giftWrap?: {
    isGift: boolean;
    price: number;
    message?: string;
  };
}

export const getCartItemId = (item: CartItem) => {
  return `${item.productId}-${item.sizeVariant.id}-${item.potVariant.id}-${Boolean(item.giftWrap?.isGift)}`;
};

interface CartContextType {
  cartItems: CartItem[];
  cartOpen: boolean;
  cartCount: number;
  addToCart: (item: CartItem, silent?: boolean) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCartModal: () => void;
  getSubtotal: () => number;
  shippingConfig: { shippingCost: number; freeShippingThreshold: number };
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [shippingConfig, setShippingConfig] = useState({ shippingCost: 50, freeShippingThreshold: 60 });
  const { customer, customerToken } = useAuth();
  
  const initialFetchDone = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cartItems');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error hydrating cart from localStorage:', error);
    }
    setIsHydrated(true);

    // Fetch shipping config
    fetch(buildApiUrl('/api/shipping/store-config'), { headers: getApiHeaders() })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setShippingConfig(data.data);
        }
      })
      .catch(err => console.error('Error fetching shipping config:', err));
  }, []);

  // Sync from DB when user logs in
  useEffect(() => {
    const fetchCartFromDB = async () => {
      if (!customerToken) return;
      try {
        const res = await fetch(buildApiUrl('api/cart'), {
          headers: getApiHeaders(customerToken)
        });
        const data = await res.json();
        
        if (data.success && data.data?.items) {
          const dbItems = data.data.items;
          const localItemsStr = localStorage.getItem('cartItems');
          const localItems = localItemsStr ? JSON.parse(localItemsStr) : [];
          
          if (dbItems.length > 0) {
             setCartItems(dbItems);
             localStorage.setItem('cartItems', JSON.stringify(dbItems));
          } else if (localItems.length > 0) {
             // If DB is empty but we have local items (guest added items then logged in), push local to DB
             syncCartToDB(localItems);
          }
        }
      } catch (err) {
        console.error('Failed to fetch cart from DB:', err);
      } finally {
        initialFetchDone.current = true;
      }
    };

    if (customerToken && isHydrated && !initialFetchDone.current) {
      fetchCartFromDB();
    } else if (!customerToken) {
      initialFetchDone.current = false; // reset when logged out
    }
  }, [customerToken, isHydrated]);

  // Sync to DB function
  const syncCartToDB = useCallback(async (items: CartItem[]) => {
    if (!customerToken) return;
    try {
      await fetch(buildApiUrl('api/cart'), {
        method: 'POST',
        headers: getApiHeaders(customerToken),
        body: JSON.stringify({ items })
      });
    } catch (err) {
      console.error('Failed to sync cart to DB:', err);
    }
  }, [customerToken]);

  // Save to localStorage and DB whenever cart changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      
      if (customerToken && initialFetchDone.current) {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => {
           syncCartToDB(cartItems);
        }, 1000); // debounce 1s
      }
    }
  }, [cartItems, isHydrated, customerToken, syncCartToDB]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = useCallback((item: CartItem, silent = false) => {
    setCartItems((prevItems) => {
      const incomingUnitPrice = item.quantity > 0 ? item.totalPrice / item.quantity : item.totalPrice;

      const existingItem = prevItems.find(
        (i) => getCartItemId(i) === getCartItemId(item)
      );

      if (existingItem) {
        const existingUnitPrice = existingItem.quantity > 0
          ? existingItem.totalPrice / existingItem.quantity
          : incomingUnitPrice;

        return prevItems.map((i) =>
          i === existingItem
            ? {
                ...i,
                quantity: i.quantity + item.quantity,
                totalPrice: (i.quantity + item.quantity) * existingUnitPrice,
              }
            : i
        );
      }

      return [
        ...prevItems,
        {
          ...item,
          totalPrice: incomingUnitPrice * item.quantity,
        },
      ];
    });
    if (!silent) setCartOpen(true);
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => getCartItemId(item) !== cartItemId)
    );
  }, []);

  const updateQuantity = useCallback(
    (cartItemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(cartItemId);
        return;
      }

      setCartItems((prevItems) =>
        prevItems.map((item) =>
          getCartItemId(item) === cartItemId
            ? {
                ...item,
                quantity,
                totalPrice: quantity * (item.totalPrice / item.quantity),
              }
            : item
        )
      );
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
    localStorage.removeItem('cartItems');
    if (customerToken) {
       fetch(buildApiUrl('api/cart'), {
          method: 'DELETE',
          headers: getApiHeaders(customerToken)
       }).catch(err => console.error('Error clearing remote cart', err));
    }
  }, [customerToken]);

  const toggleCartModal = useCallback(() => {
    setCartOpen((prev) => !prev);
  }, []);

  const getSubtotal = useCallback(() => {
    return cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cartItems]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartOpen,
        cartCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleCartModal,
        getSubtotal,
        shippingConfig,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
