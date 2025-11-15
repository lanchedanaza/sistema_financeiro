-- ============================================
-- ADICIONAR PRODUTOS ALMOÇO
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- para adicionar os produtos de Almoço

INSERT INTO products (name, price, active) VALUES
('Almoço - Funcionário', 18.00, true),
('Almoço - Cliente', 20.00, true);

-- Verificar produtos inseridos
SELECT id, name, price, active, created_at 
FROM products 
WHERE name LIKE '%Almoço%'
ORDER BY name;

-- ============================================
-- FIM DO SCRIPT
-- ============================================

