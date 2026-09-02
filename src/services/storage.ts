/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Customer, Order, DailyLimit, InventoryItem, MenuProduct } from '../types';

const STORAGE_KEYS = {
  CUSTOMERS: 'prdoces_customers',
  ORDERS: 'prdoces_orders',
  DAILY_LIMITS: 'prdoces_limits',
  INVENTORY: 'prdoces_inventory',
  MENU_PRODUCTS: 'prdoces_menu',
  CATALOG_BGS: 'prdoces_catalog_bgs'
};

export interface CatalogBg {
  id: string;
  label: string;
  url: string | null;
  gradient: string;
}

const INITIAL_PRODUCTS: MenuProduct[] = [
  { id: 'mini_trufa_tradicional', label: 'Mini Trufas Tradicionais', price: 140.00, minQty: 50, isByHundred: true },
  { id: 'mini_trufa_frutas', label: 'Mini Trufas Frutas', price: 160.00, minQty: 50, isByHundred: true },
  { id: 'brigadeiro_classico', label: 'Brigadeiros Clássicos', price: 110.00, minQty: 50, isByHundred: true },
  { id: 'bombom_fruta', label: 'Bombons de Fruta', price: 2.50, minQty: 20, isByHundred: false },
  { id: 'trufa_decorada', label: 'Trufas Decoradas', price: 2.00, minQty: 20, isByHundred: false },
  { id: 'pirulito_decorado', label: 'Pirulitos Decorados', price: 7.00, minQty: 10, isByHundred: false },
  { id: 'cupcake', label: 'Cupcakes', price: 4.00, minQty: 15, isByHundred: false }
];

export const storage = {
  getCatalogBgs: (): CatalogBg[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CATALOG_BGS);
    return data ? JSON.parse(data) : [];
  },
  saveCatalogBg: (bg: CatalogBg) => {
    const bgs = storage.getCatalogBgs();
    bgs.push(bg);
    localStorage.setItem(STORAGE_KEYS.CATALOG_BGS, JSON.stringify(bgs));
  },
  deleteCatalogBg: (id: string) => {
    const bgs = storage.getCatalogBgs();
    const updated = bgs.filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEYS.CATALOG_BGS, JSON.stringify(updated));
  },
  getMenuProducts: (): MenuProduct[] => {
    const data = localStorage.getItem(STORAGE_KEYS.MENU_PRODUCTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.MENU_PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(data);
  },
  saveMenuProduct: (product: MenuProduct) => {
    const products = storage.getMenuProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.push(product);
    }
    localStorage.setItem(STORAGE_KEYS.MENU_PRODUCTS, JSON.stringify(products));
  },
  deleteMenuProduct: (id: string) => {
    const products = storage.getMenuProducts();
    const updated = products.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.MENU_PRODUCTS, JSON.stringify(updated));
  },
  getCustomers: (): Customer[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return data ? JSON.parse(data) : [];
  },
  saveCustomer: (customer: Customer) => {
    const customers = storage.getCustomers();
    const index = customers.findIndex(c => c.id === customer.id);
    if (index >= 0) {
      customers[index] = customer;
    } else {
      customers.push(customer);
    }
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  },

  getOrders: (): Order[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return data ? JSON.parse(data) : [];
  },
  saveOrder: (order: Order) => {
    const orders = storage.getOrders();
    const index = orders.findIndex(o => o.id === order.id);
    if (index >= 0) {
      orders[index] = order;
    } else {
      orders.push(order);
    }
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  },

  getDailyLimits: (): DailyLimit[] => {
    const data = localStorage.getItem(STORAGE_KEYS.DAILY_LIMITS);
    return data ? JSON.parse(data) : [];
  },
  saveDailyLimit: (limit: DailyLimit) => {
    const limits = storage.getDailyLimits();
    const index = limits.findIndex(l => l.date === limit.date);
    if (index >= 0) {
      limits[index] = limit;
    } else {
      limits.push(limit);
    }
    localStorage.setItem(STORAGE_KEYS.DAILY_LIMITS, JSON.stringify(limits));
  },

  getInventory: (): InventoryItem[] => {
    const data = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    return data ? JSON.parse(data) : [];
  },
  saveInventoryItem: (item: InventoryItem) => {
    const items = storage.getInventory();
    const index = items.findIndex(i => i.id === item.id);
    if (index >= 0) {
      items[index] = item;
    } else {
      items.push(item);
    }
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(items));
  },
  deleteInventoryItem: (id: string) => {
    const items = storage.getInventory();
    const updated = items.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(updated));
  }
};
