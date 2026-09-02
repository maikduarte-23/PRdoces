// Usa o caminho relativo para funcionar tanto no PC local quanto no celular via HTTPS
const API_URL = '/api';

export const api = {
  // --- Clientes ---
  getCustomers: async () => {
    const res = await fetch(`${API_URL}/customers`);
    if (!res.ok) throw new Error('Erro ao buscar clientes');
    return res.json();
  },
  deleteCustomer: async (id: string) => {
    const res = await fetch(`${API_URL}/customers/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao deletar cliente');
  },
  saveCustomer: async (data: any) => {
    const res = await fetch(`${API_URL}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Erro ao salvar cliente');
    return res.json();
  },

  // --- Estoque (Inventory) ---
  getInventory: async () => {
    const res = await fetch(`${API_URL}/inventory`);
    if (!res.ok) throw new Error('Erro ao buscar estoque');
    return res.json();
  },
  saveInventoryItem: async (data: any) => {
    const res = await fetch(`${API_URL}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Erro ao salvar item de estoque');
    return res.json();
  },
  deleteInventoryItem: async (id: string) => {
    const res = await fetch(`${API_URL}/inventory/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao deletar item do estoque');
  },

  // --- Cardápio (Menu Products) ---
  getMenuProducts: async () => {
    const res = await fetch(`${API_URL}/menu-products`);
    if (!res.ok) throw new Error('Erro ao buscar cardápio');
    return res.json();
  },
  saveMenuProduct: async (data: any) => {
    const res = await fetch(`${API_URL}/menu-products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Erro ao salvar produto do cardápio');
    return res.json();
  },
  deleteMenuProduct: async (id: string) => {
    const res = await fetch(`${API_URL}/menu-products/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao deletar produto do menu');
  },

  // --- Pedidos (Orders) ---
  getOrders: async (params: { page?: number, limit?: number, search?: string, filter?: string } = {}) => {
    const query = new URLSearchParams({
      page: params.page?.toString() || '1',
      limit: params.limit?.toString() || '9',
      search: params.search || '',
      filter: params.filter || 'all',
    });
    const res = await fetch(`${API_URL}/orders?${query.toString()}`);
    if (!res.ok) throw new Error('Erro ao buscar pedidos');
    // Retorna o objeto completo { orders: [], totalCount: 0 }
    return res.json();
  },
  saveOrder: async (data: any) => {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Erro ao salvar pedido');
    return res.json();
  },
  deleteOrder: async (id: string) => {
    const res = await fetch(`${API_URL}/orders/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao deletar pedido');
  },
  getOrderSummary: async () => {
    const res = await fetch(`${API_URL}/orders/summary`);
    if (!res.ok) throw new Error('Erro ao buscar resumo financeiro');
    return res.json();
  },

  // --- Limites Diários (Daily Limits) ---
  getDailyLimits: async () => {
    const res = await fetch(`${API_URL}/daily-limits`);
    if (!res.ok) throw new Error('Erro ao buscar limites diários');
    return res.json();
  },
  saveDailyLimit: async (data: any) => {
    const res = await fetch(`${API_URL}/daily-limits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Erro ao salvar limite diário');
    return res.json();
  },
  deleteDailyLimit: async (id: string) => {
    const res = await fetch(`${API_URL}/daily-limits/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao deletar limite');
  },

  // --- Despesas Fixas (Expenses) ---
  getExpenses: async () => {
    const res = await fetch(`${API_URL}/expenses`);
    if (!res.ok) throw new Error('Erro ao buscar despesas');
    return res.json();
  },
  saveExpense: async (data: any) => {
    const res = await fetch(`${API_URL}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Erro ao salvar despesa');
    return res.json();
  },
  deleteExpense: async (id: string) => {
    const res = await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao deletar despesa');
  },

  // --- Configurações (Settings) ---
  getSettings: async (): Promise<Record<string, string>> => {
    const res = await fetch(`${API_URL}/settings`);
    if (!res.ok) throw new Error('Erro ao buscar configurações');
    return res.json();
  },
  saveSetting: async (data: { key: string, value: any }) => {
    // Se o valor for nulo ou undefined, salva como string vazia para poder remover a configuração
    const valueToSave = data.value === null || data.value === undefined ? '' : data.value;
    const res = await fetch(`${API_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: data.key, value: valueToSave })
    });
    if (!res.ok) throw new Error(`Erro ao salvar configuração: ${data.key}`);
    return res.json();
  },
};