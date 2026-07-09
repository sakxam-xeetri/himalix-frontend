import React, {
  createContext, useContext, useState, useEffect, useCallback
} from 'react';
import { useAuth } from '../auth/AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user, authFetch } = useAuth();
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(false);

  const localKey = 'himalix-cart';

  const fetchCart = useCallback(async () => {
    if (user) {
      try {
        setLoading(true);
        // Sync guest cart before fetching server cart
        let localItems = [];
        try {
          localItems = JSON.parse(localStorage.getItem(localKey) || '[]');
        } catch (err) {
          console.error('Failed to parse local cart items:', err);
        }
        if (localItems.length > 0) {
          try {
            await authFetch('/api/store/cart/sync', {
              method: 'POST',
              body: JSON.stringify({ 
                items: localItems.map(i => ({
                  product_id: i.product_id,
                  quantity: i.quantity,
                  is_project: i.is_project || false
                }))
              })
            });
            localStorage.removeItem(localKey);
          } catch (err) {
            console.error('Failed to sync guest cart:', err);
          }
        }

        const res  = await authFetch('/api/store/cart');
        if (!res.ok) {
          throw new Error(`Failed to fetch cart: HTTP ${res.status}`);
        }
        const data = await res.json();
        if (data.success) setItems(data.cart || []);
      } catch (e) { /* swallow */ }
      finally { setLoading(false); }
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem(localKey) || '[]');
        setItems(saved);
      } catch { setItems([]); }
    }
  }, [user, authFetch]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  /* Sync guest cart to localStorage */
  useEffect(() => {
    if (!user) localStorage.setItem(localKey, JSON.stringify(items));
  }, [items, user]);

  /* Add or increment */
  const addToCart = useCallback(async (product, qty = 1) => {
    if (user) {
      const res = await authFetch('/api/store/cart', {
        method: 'POST',
        body: JSON.stringify({ 
          product_id: product.id, 
          quantity: qty,
          is_project: product.is_project || false,
          is_3d: product.is_3d || false,
          custom_responses: product.custom_responses || null
        })
      });
      if (!res.ok) {
        throw new Error(`Failed to add item to cart: HTTP ${res.status}`);
      }
      fetchCart();
    } else {
      setItems(prev => {
        const tempId = Date.now() + Math.random();
        return [...prev, {
          id: tempId,
          product_id: product.id,
          quantity: qty,
          product_name: product.name,
          price: product.price,
          image_url: product.image_url,
          is_project: product.is_project || false,
          is_3d: product.is_3d || false,
          custom_responses: product.custom_responses || null
        }];
      });
    }
  }, [user, authFetch, fetchCart]);

  /* Update quantity */
  const updateQty = useCallback(async (cartItemId, qty) => {
    if (qty < 1) return;
    if (user) {
      const res = await authFetch('/api/store/cart/update', {
        method: 'PUT',
        body: JSON.stringify({ 
          cartItemId,
          quantity: qty
        })
      });
      if (!res.ok) {
        throw new Error(`Failed to update quantity: HTTP ${res.status}`);
      }
      fetchCart();
    } else {
      setItems(prev =>
        prev.map(i => i.id === cartItemId ? { ...i, quantity: qty } : i)
      );
    }
  }, [user, authFetch, fetchCart]);

  /* Remove item */
  const removeItem = useCallback(async (cartItemId) => {
    if (user) {
      const res = await authFetch(`/api/store/cart/remove/${cartItemId}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error(`Failed to remove item: HTTP ${res.status}`);
      }
      fetchCart();
    } else {
      setItems(prev => prev.filter(i => i.id !== cartItemId));
    }
  }, [user, authFetch, fetchCart]);

  /* Clear cart */
  const clearCart = useCallback(async () => {
    if (user) {
      const res = await authFetch('/api/store/cart', { method: 'DELETE' });
      if (!res.ok) {
        throw new Error(`Failed to clear cart: HTTP ${res.status}`);
      }
    }
    setItems([]);
  }, [user, authFetch]);

  const itemCount   = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, loading, itemCount, totalAmount,
      addToCart, updateQty, removeItem, clearCart, fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
