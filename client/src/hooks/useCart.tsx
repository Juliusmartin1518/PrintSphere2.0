import { useState, createContext, useContext, ReactNode } from "react";
import { CartItem } from "@/lib/types";

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateItem: (index: number, item: Partial<CartItem>) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
  subtotal: number;
  discount: number;
  total: number;
  setDiscount: (discount: number) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);

  const addItem = (item: CartItem) => {
    setItems([...items, item]);
  };

  const updateItem = (index: number, updatedItem: Partial<CartItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updatedItem };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setItems([]);
    setDiscount(0);
  };

  // Calculate subtotal and total
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const total = Math.max(subtotal - discount, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateItem,
        removeItem,
        clearCart,
        subtotal,
        discount,
        total,
        setDiscount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
