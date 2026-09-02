/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Customer {
  id: string;
  name: string;
  phone: string;
  dietaryRestrictions: string;
  historyThemes: string[];
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  date: string; // ISO string
  time: string;
  deliveryType: 'retirada' | 'uber';
  items: OrderItem[];
  totalPrice: number;
  depositPaid: boolean;
  notes: string;
  status: 'pendente' | 'confirmado' | 'entregue' | 'cancelado';
}

export interface MenuProduct {
  id: string;
  label: string;
  price: number;
  minQty: number;
  isByHundred: boolean;
}

export interface OrderItem {
  id: string;
  type: string; // Dynamic type referencing MenuProduct id or name
  quantity: number;
  unitPrice: number;
  decorationPricePerUnit: number;
  flowerWrappers: boolean;
  flowerWrapperPrice: number;
  total: number;
}

export interface DailyLimit {
  date: string;
  limit: number;
  currentCount: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'insumo' | 'produto';
  quantity: number;
  unit: string;
  minQuantity: number;
  unitPrice: number;
}
