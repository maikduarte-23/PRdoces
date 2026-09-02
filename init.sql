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
  category VARCHAR(100),
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