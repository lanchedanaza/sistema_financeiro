-- ============================================
-- ADICIONAR CAMPO DE MEIO DE PAGAMENTO
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- para adicionar o campo de meio de pagamento

-- Adicionar campo payment_method na tabela sales
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS payment_method TEXT 
CHECK (payment_method IS NULL OR payment_method IN ('dinheiro', 'pix', 'cartao_debito', 'cartao_credito', 'fiado'));

-- Adicionar campo payment_method na tabela debts
ALTER TABLE debts 
ADD COLUMN IF NOT EXISTS payment_method TEXT 
CHECK (payment_method IS NULL OR payment_method IN ('dinheiro', 'pix', 'cartao_debito', 'cartao_credito', 'fiado'));

-- Comentário para documentação
COMMENT ON COLUMN sales.payment_method IS 'Meio de pagamento: dinheiro, pix, cartao_debito, cartao_credito, fiado';
COMMENT ON COLUMN debts.payment_method IS 'Meio de pagamento: dinheiro, pix, cartao_debito, cartao_credito, fiado';

-- ============================================
-- FIM DO SCRIPT
-- ============================================

