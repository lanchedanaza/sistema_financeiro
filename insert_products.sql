-- ============================================
-- INSERÇÃO DE PRODUTOS - VIDA CANTINA
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- para cadastrar todos os produtos

-- Limpar produtos existentes (opcional - descomente se quiser limpar antes)
-- DELETE FROM products;

-- Inserir produtos
INSERT INTO products (name, price, active) VALUES
('Pão com Ovo', 6.00, true),
('Pão com Manteiga', 4.00, true),
('Pão com Queijo', 5.00, true),
('Pão com Queijo e Presunto', 6.00, true),
('Pão com Queijo, Presunto e Ovos', 8.00, true),
('Tapioca Simples', 5.00, true),
('Tapioca com Queijo', 6.00, true),
('Tapioca com Queijo e Presunto', 7.00, true),
('Tapioca com Queijo, Presunto e Ovos', 10.00, true),
('Baguete', 7.00, true),
('Sanduíche Natural', 7.00, true),
('Salgados Diversos', 7.00, true),
('Mingau', 6.00, true),
('Suco Natural', 5.00, true),
('Café Preto', 2.00, true),
('Café com Leite', 4.00, true),
('Refrigerante em Lata', 5.00, true),
('Água 500ml', 3.00, true),
('Água Hidro Limão', 5.00, true),
('Água com Gás', 3.00, true),
('Água Tônica', 5.00, true),
('Sopas e Caldos', 8.00, true),
('Energético', 14.00, true),
('Almoço - Funcionário', 18.00, true),
('Almoço - Cliente', 20.00, true);

-- Verificar produtos inseridos
SELECT id, name, price, active, created_at 
FROM products 
ORDER BY name;

-- ============================================
-- FIM DO SCRIPT
-- ============================================

