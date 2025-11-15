-- ============================================
-- SCHEMA DO BANCO DE DADOS - LANCHONETE
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- para criar todas as tabelas necessárias

-- ============================================
-- 1. TABELA: products (Produtos)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida de produtos ativos
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active) WHERE active = true;

-- ============================================
-- 2. TABELA: clients (Clientes)
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  total_debt NUMERIC(10, 2) DEFAULT 0 CHECK (total_debt >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida por nome
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- ============================================
-- 3. TABELA: sales (Vendas)
-- ============================================
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
  paid BOOLEAN DEFAULT false,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_paid ON sales(paid);
CREATE INDEX IF NOT EXISTS idx_sales_client_id ON sales(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id) WHERE product_id IS NOT NULL;

-- ============================================
-- 4. TABELA: debts (Dívidas)
-- ============================================
CREATE TABLE IF NOT EXISTS debts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  description TEXT NOT NULL,
  paid BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_debts_client_id ON debts(client_id);
CREATE INDEX IF NOT EXISTS idx_debts_paid ON debts(paid);
CREATE INDEX IF NOT EXISTS idx_debts_created_at ON debts(created_at DESC);

-- ============================================
-- 5. TABELA: reservations (Reservas)
-- ============================================
CREATE TABLE IF NOT EXISTS reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed_paid', 'completed_debt', 'missed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_reservations_scheduled_date ON reservations(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_status_date ON reservations(status, scheduled_date);

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================
-- Habilitar RLS em todas as tabelas
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir todas as operações (ajuste conforme sua necessidade de segurança)
-- Para desenvolvimento, permitimos tudo. Em produção, ajuste conforme necessário.

-- Products: permitir todas as operações
CREATE POLICY "Permitir todas as operações em products"
  ON products FOR ALL
  USING (true)
  WITH CHECK (true);

-- Clients: permitir todas as operações
CREATE POLICY "Permitir todas as operações em clients"
  ON clients FOR ALL
  USING (true)
  WITH CHECK (true);

-- Sales: permitir todas as operações
CREATE POLICY "Permitir todas as operações em sales"
  ON sales FOR ALL
  USING (true)
  WITH CHECK (true);

-- Debts: permitir todas as operações
CREATE POLICY "Permitir todas as operações em debts"
  ON debts FOR ALL
  USING (true)
  WITH CHECK (true);

-- Reservations: permitir todas as operações
CREATE POLICY "Permitir todas as operações em reservations"
  ON reservations FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- COMENTÁRIOS NAS TABELAS (Documentação)
-- ============================================
COMMENT ON TABLE products IS 'Tabela de produtos da lanchonete';
COMMENT ON TABLE clients IS 'Tabela de clientes';
COMMENT ON TABLE sales IS 'Tabela de vendas realizadas';
COMMENT ON TABLE debts IS 'Tabela de dívidas dos clientes';
COMMENT ON TABLE reservations IS 'Tabela de reservas agendadas';

-- ============================================
-- FIM DO SCRIPT
-- ============================================

