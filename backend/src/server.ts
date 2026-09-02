import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Conexão com o Banco de Dados
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST, // Virá do docker-compose: 'banco_de_dados'
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432, // Porta interna do container do Postgres
});

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || '*' // Permite requisições do frontend local ou via VPN Tailscale
}));
app.use(express.json()); // Permite que o servidor entenda JSON

// Rota de teste
app.get('/api', (req, res) => {
  res.send('Backend P.R_Doces está online!');
});

// Função utilitária para garantir que campos JSON do banco sejam convertidos para Array/Objeto
const parseJson = (data: any, fallback: any = []) => {
  if (typeof data === 'string') {
    try { return JSON.parse(data); } 
    catch (e) { return fallback; }
  }
  return data || fallback;
};

// Rota para listar todos os clientes
app.get('/api/customers', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM customers');
    const customers = rows.map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      dietaryRestrictions: row.dietary_restrictions,
      historyThemes: parseJson(row.history_themes)
    }));
    res.json(customers);
  } catch (err) {
    console.error('Erro ao buscar clientes:', err);
    res.status(500).send('Erro no Servidor');
  }
});

// Rota para salvar/atualizar um cliente
app.post('/api/customers', async (req, res) => {
  try {
    const { id, name, phone, dietaryRestrictions, historyThemes } = req.body;
    
    // Este comando SQL insere um novo cliente. Se o ID já existir, ele atualiza os dados.
    const query = `
      INSERT INTO customers (id, name, phone, dietary_restrictions, history_themes) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        dietary_restrictions = EXCLUDED.dietary_restrictions,
        history_themes = EXCLUDED.history_themes
      RETURNING *;
    `;
    // O historyThemes que é um array no JS, guardamos como um texto JSON no banco
    const values = [id, name, phone, dietaryRestrictions, JSON.stringify(historyThemes || [])];
    
    const { rows } = await pool.query(query, values);
    
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao salvar cliente:', err);
    res.status(500).send('Erro no Servidor');
  }
});


app.delete('/api/customers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error('Erro ao deletar cliente:', err);
    res.status(500).send('Erro no Servidor');
  }
});

// --- ROTAS DE ESTOQUE (INVENTORY) ---
app.get('/api/inventory', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM inventory_items');
    const items = rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      quantity: Number(row.quantity),
      unit: row.unit,
      minQuantity: Number(row.min_quantity),
      unitPrice: Number(row.unit_price)
    }));
    res.json(items);
  } catch (err) {
    console.error('Erro no estoque:', err);
    res.status(500).send('Erro no Servidor');
  }
});

app.post('/api/inventory', async (req, res) => {
  try {
    const { id, name, category, quantity, unit, minQuantity, unitPrice } = req.body;
    const query = `
      INSERT INTO inventory_items (id, name, category, quantity, unit, min_quantity, unit_price) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, category = EXCLUDED.category, quantity = EXCLUDED.quantity,
        unit = EXCLUDED.unit, min_quantity = EXCLUDED.min_quantity, unit_price = EXCLUDED.unit_price
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [id, name, category, quantity, unit, minQuantity, unitPrice]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao salvar estoque:', err);
    res.status(500).send('Erro no Servidor');
  }
});

app.delete('/api/inventory/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM inventory_items WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error('Erro ao deletar estoque:', err);
    res.status(500).send('Erro no Servidor');
  }
});

// --- ROTAS DE CARDÁPIO (MENU PRODUCTS) ---
app.get('/api/menu-products', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM menu_products');
    const products = rows.map(row => ({
      id: row.id,
      label: row.label,
      price: Number(row.price),
      minQty: row.min_qty,
      isByHundred: row.is_by_hundred,
      recipe: parseJson(row.recipe)
    }));
    res.json(products);
  } catch (err) {
    console.error('Erro no cardápio:', err);
    res.status(500).send('Erro no Servidor');
  }
});

app.post('/api/menu-products', async (req, res) => {
  try {
    const { id, label, price, minQty, isByHundred, recipe } = req.body;
    const query = `
      INSERT INTO menu_products (id, label, price, min_qty, is_by_hundred, recipe) 
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        label = EXCLUDED.label, price = EXCLUDED.price, 
        min_qty = EXCLUDED.min_qty, is_by_hundred = EXCLUDED.is_by_hundred, recipe = EXCLUDED.recipe
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [id, label, price, minQty, isByHundred, JSON.stringify(recipe || [])]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao salvar cardápio:', err);
    res.status(500).send('Erro no Servidor');
  }
});

app.delete('/api/menu-products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM menu_products WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error('Erro ao deletar cardápio:', err);
    res.status(500).send('Erro no Servidor');
  }
});

// --- ROTAS DE PEDIDOS (ORDERS) ---
app.get('/api/orders', async (req, res) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 9; // Padrão de 9 itens
  const search = req.query.search as string || '';
  const filter = req.query.filter as string || 'all';
  const offset = (page - 1) * limit;

  const whereClauses: string[] = ["status <> 'cancelado'"];
  const queryParams: any[] = [];

  if (search) {
    queryParams.push(`%${search.toLowerCase()}%`);
    whereClauses.push(`LOWER(customer_name) LIKE $${queryParams.length}`);
  }

  if (filter === 'waiting_deposit') {
    whereClauses.push('deposit_paid = false');
  } else if (filter === 'pending_final') {
    whereClauses.push("deposit_paid = true AND status <> 'entregue'");
  } else if (filter === 'completed') {
    whereClauses.push("status = 'entregue'");
  }

  const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  try {
    // Query para contar o total de itens que correspondem ao filtro
    const countQuery = `SELECT COUNT(*) FROM orders ${whereString}`;
    const totalResult = await pool.query(countQuery, queryParams);
    const totalCount = parseInt(totalResult.rows[0].count, 10);

    // Query para buscar os dados paginados
    const dataQuery = `SELECT * FROM orders ${whereString} ORDER BY date DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    const { rows } = await pool.query(dataQuery, [...queryParams, limit, offset]);

    const orders = rows.map(row => ({
      id: row.id, customerId: row.customer_id, customerName: row.customer_name,
      createdAt: row.created_at, date: row.date, time: row.time,
      deliveryType: row.delivery_type, items: parseJson(row.items),
      totalPrice: Number(row.total_price), depositPaid: row.deposit_paid,
      notes: row.notes, status: row.status
    }));

    res.json({ orders, totalCount });
  } catch (err) {
    console.error('Erro nos pedidos:', err);
    res.status(500).send('Erro no Servidor');
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { id, customerId, customerName, createdAt, date, time, deliveryType, items, totalPrice, depositPaid, notes, status } = req.body;
    const query = `
      INSERT INTO orders (id, customer_id, customer_name, created_at, date, time, delivery_type, items, total_price, deposit_paid, notes, status) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        customer_id = EXCLUDED.customer_id, customer_name = EXCLUDED.customer_name, date = EXCLUDED.date,
        time = EXCLUDED.time, delivery_type = EXCLUDED.delivery_type, items = EXCLUDED.items,
        total_price = EXCLUDED.total_price, deposit_paid = EXCLUDED.deposit_paid, notes = EXCLUDED.notes, status = EXCLUDED.status
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [id, customerId, customerName, createdAt || new Date().toISOString(), date, time, deliveryType, JSON.stringify(items || []), totalPrice, depositPaid, notes, status]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao salvar pedido:', err);
    res.status(500).send('Erro no Servidor');
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM orders WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error('Erro ao deletar pedido:', err);
    res.status(500).send('Erro no Servidor');
  }
});

// --- ROTA DE RESUMO FINANCEIRO (ORDERS SUMMARY) ---
app.get('/api/orders/summary', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COALESCE(SUM(CASE
          WHEN status = 'entregue' THEN 0
          WHEN deposit_paid = true THEN total_price / 2
          ELSE total_price
        END), 0) AS "totalReceivable",
        COALESCE(SUM(CASE
          WHEN status = 'entregue' THEN total_price
          WHEN deposit_paid = true THEN total_price / 2
          ELSE 0
        END), 0) AS "totalReceived"
      FROM orders
      WHERE status <> 'cancelado'
    `);
    const summary = {
      totalReceivable: Number(rows[0].totalReceivable),
      totalReceived: Number(rows[0].totalReceived),
      expectedTotal: Number(rows[0].totalReceivable) + Number(rows[0].totalReceived)
    };
    res.json(summary);
  } catch (err) {
    console.error('Erro ao calcular resumo financeiro:', err);
    res.status(500).send('Erro no Servidor');
  }
});

// --- ROTAS DE LIMITES DIÁRIOS (DAILY LIMITS) ---
app.get('/api/daily-limits', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM daily_limits');
    const limits = rows.map(row => ({
      id: row.id,
      date: row.date,
      limit: Number(row.limit_value)
    }));
    res.json(limits);
  } catch (err) {
    console.error('Erro nos limites diários:', err);
    res.status(500).send('Erro no Servidor');
  }
});

app.post('/api/daily-limits', async (req, res) => {
  try {
    const { id, date, limit } = req.body;
    const query = `
      INSERT INTO daily_limits (id, date, limit_value) 
      VALUES ($1, $2, $3)
      ON CONFLICT (date) DO UPDATE SET
        limit_value = EXCLUDED.limit_value
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [id, date, limit]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao salvar limite diário:', err);
    res.status(500).send('Erro no Servidor');
  }
});

app.delete('/api/daily-limits/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM daily_limits WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error('Erro ao deletar limite diário:', err);
    res.status(500).send('Erro no Servidor');
  }
});

// --- ROTAS DE DESPESAS FIXAS (EXPENSES) ---
app.get('/api/expenses', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM expenses');
    const expenses = rows.map(row => ({
      id: row.id,
      description: row.description,
      amount: Number(row.amount)
    }));
    res.json(expenses);
  } catch (err) {
    console.error('Erro nas despesas:', err);
    res.status(500).send('Erro no Servidor');
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const { id, description, amount } = req.body;
    const query = `
      INSERT INTO expenses (id, description, amount) 
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET
        description = EXCLUDED.description, amount = EXCLUDED.amount
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [id, description, amount]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao salvar despesa:', err);
    res.status(500).send('Erro no Servidor');
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM expenses WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error('Erro ao deletar despesa:', err);
    res.status(500).send('Erro no Servidor');
  }
});

// --- ROTAS DE CONFIGURAÇÕES (SETTINGS) ---
app.get('/api/settings', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM settings');
    // Transforma o array de {key, value} em um objeto { key1: value1, key2: value2 }
    const settings = rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
    res.json(settings);
  } catch (err) {
    console.error('Erro ao buscar configurações:', err);
    res.status(500).send('Erro no Servidor');
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) {
      return res.status(400).send('A chave (key) é obrigatória.');
    }
    const query = `
      INSERT INTO settings (key, value) 
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [key, value]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao salvar configuração:', err);
    res.status(500).send('Erro no Servidor');
  }
});

const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        dietary_restrictions TEXT,
        history_themes JSONB
      );
      CREATE TABLE IF NOT EXISTS inventory_items (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50),
        quantity NUMERIC,
        unit VARCHAR(20),
        min_quantity NUMERIC,
        unit_price NUMERIC
      );
      CREATE TABLE IF NOT EXISTS menu_products (
        id VARCHAR(255) PRIMARY KEY,
        label VARCHAR(255) NOT NULL,
        price NUMERIC,
        min_qty INTEGER,
        is_by_hundred BOOLEAN,
        recipe JSONB DEFAULT '[]'::jsonb
      );
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY,
        customer_id VARCHAR(255),
        customer_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        time VARCHAR(50),
        delivery_type VARCHAR(50),
        items JSONB NOT NULL,
        total_price NUMERIC NOT NULL,
        deposit_paid BOOLEAN DEFAULT false,
        notes TEXT,
        status VARCHAR(50)
      );
      CREATE TABLE IF NOT EXISTS daily_limits (
        id VARCHAR(255) PRIMARY KEY,
        date VARCHAR(10) NOT NULL UNIQUE,
        limit_value INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(255) PRIMARY KEY,
        description VARCHAR(255) NOT NULL,
        amount NUMERIC NOT NULL
      );
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT
      );
    `);
    console.log('Tabelas verificadas/criadas com sucesso!');
  } catch (err) {
    console.error('Erro ao inicializar tabelas:', err);
  }
};

app.listen(port, async () => {
  console.log(`Backend ouvindo na porta ${port}`);
  await initDB();
});