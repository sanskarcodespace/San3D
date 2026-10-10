export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type FulfillmentStatus = "unfulfilled" | "printing" | "shipped" | "delivered" | "cancelled";

/** Immutable purchase snapshot, independent of later catalog edits. */
export interface OrderItem {
  variantId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPriceInPaise: number;
}

export interface Order {
  id: string;
  customerId: string;
  currency: "INR";
  totalInPaise: number;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  items: OrderItem[];
  createdAt: string;
}
