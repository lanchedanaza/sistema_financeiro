export interface Product {
  id: string;
  name: string;
  price: number;
  active: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  total_debt: number;
  created_at: string;
}

export interface Sale {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  paid: boolean;
  client_id?: string;
  payment_method?: 'dinheiro' | 'pix' | 'cartao_debito' | 'cartao_credito' | 'fiado';
  created_at: string;
}

export interface Debt {
  id: string;
  client_id: string;
  sale_id?: string;
  amount: number;
  description: string;
  paid: boolean;
  payment_method?: 'dinheiro' | 'pix' | 'cartao_debito' | 'cartao_credito' | 'fiado';
  created_at: string;
  paid_at?: string;
}

export interface Reservation {
  id: string;
  client_name: string;
  product_name: string;
  amount: number;
  scheduled_date: string;
  status: 'pending' | 'completed_paid' | 'completed_debt' | 'missed';
  created_at: string;
}
