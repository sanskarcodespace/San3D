"use client";
import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { Product } from "../products/types";
import type { CartItem } from "./types";
import { cartKey, cartTotal, readCart } from "./model";
const KEY = "san3d-demo-cart-v1";
let memoryCart = "[]";
let storageUnavailable = false;
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("san3d-cart", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("san3d-cart", callback);
  };
}
function snapshot() {
  if (storageUnavailable) return memoryCart;
  try {
    return window.localStorage.getItem(KEY) ?? "[]";
  } catch {
    return memoryCart;
  }
}
function write(items: CartItem[]) {
  memoryCart = JSON.stringify(items);
  try {
    window.localStorage.setItem(KEY, memoryCart);
  } catch {
    storageUnavailable = true;
  }
  window.dispatchEvent(new Event("san3d-cart"));
}
interface CartContextValue {
  items: CartItem[];
  products: Product[];
  count: number;
  total: number;
  add: (item: CartItem) => void;
  update: (key: string, quantity: number) => void;
  remove: (key: string) => void;
}
const CartContext = createContext<CartContextValue | null>(null);
export function CartProvider({
  products,
  children,
}: {
  products: Product[];
  children: React.ReactNode;
}) {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  const items = useMemo(() => readCart(raw, products), [raw, products]);
  const current = () => readCart(snapshot(), products);
  return (
    <CartContext.Provider
      value={{
        items,
        products,
        count: items.reduce((sum, item) => sum + item.quantity, 0),
        total: cartTotal(items, products),
        add: (item) =>
          write(readCart(JSON.stringify([...current(), item]), products)),
        update: (key, quantity) =>
          write(
            readCart(
              JSON.stringify(
                current().map((item) =>
                  cartKey(item) === key ? { ...item, quantity } : item,
                ),
              ),
              products,
            ),
          ),
        remove: (key) =>
          write(current().filter((item) => cartKey(item) !== key)),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("CartProvider is required");
  return value;
}
