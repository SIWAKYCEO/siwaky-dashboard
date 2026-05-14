/** Normalized sheet row keys (FastAPI `/orders`). */
export type OrderRow = {
  name: string;
  phone: string;
  city: string;
  country: string;
  product: string;
  qty: string;
  price_sar: string;
  status: string;
  confirmed: string;
  delivered: string;
  returned: string;
  cod_fee: string;
  ip_address: string;
  devic: string;
};

export type OrdersPayload = {
  count: number;
  orders: OrderRow[];
};
