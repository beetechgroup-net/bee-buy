export type Category = 
  | 'Mercado'
  | 'Restaurante'
  | 'Farmácia'
  | 'Padaria'
  | 'Posto de Combustível'
  | 'Outros';

export interface Product {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  code?: string;
}

export interface Store {
  name: string;
  cnpj: string;
  address?: string;
}

export interface Purchase {
  id: string; // unique ID for local storage
  accessKey: string; // NFC-e Access Key
  date: string; // ISO String
  total: number;
  store: Store;
  products: Product[];
  category: Category;
  qrCodeUrl: string;
  createdAt: number;
}
