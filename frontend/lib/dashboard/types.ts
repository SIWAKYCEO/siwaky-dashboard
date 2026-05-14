/** Normalized sheet row keys (FastAPI `GET /orders`). */
export type OrderRow = {
  order_id: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  city: string;
  country: string;
  product: string;
  quantity: string;
  price_sar: string;
  status: string;
  confirmed: string;
  delivered: string;
  returned: string;
  cod_fee: string;
  ip_address: string;
  device: string;
  source: string;
  campaign: string;
  notes: string;
};

export type OrdersPayload = {
  count: number;
  orders: OrderRow[];
};
