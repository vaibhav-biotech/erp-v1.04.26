'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

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
}

interface CartContextType {
  cartItems: CartItem[];
  cartOpen: boolean;
  cartCount: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCartModal: () => void;
  getSubtotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = useCallback((item: CartItem) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (i) =>
          i.productId === item.productId &&
          i.sizeVariant.id === item.sizeVariant.id &&
          i.potVariant.id === item.potVariant.id
      );

      if (existingItem) {
        return prevItems.map((i) =>
          i === existingItem
            ? {
                ...i,
                quantity: i.quantity + item.quantity,
                totalPrice: (i.quantity + item.quantity) * item.totalPrice,
              }
            : i
        );
      }

      return [...prevItems, item];
    });
    setCartOpen(true);
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.productId !== productId)
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }

      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.productId === productId
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
  }, []);

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
