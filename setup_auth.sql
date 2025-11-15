-- ============================================
-- CONFIGURAÇÃO DE AUTENTICAÇÃO - SUPABASE
-- ============================================
-- Este script configura a autenticação no Supabase
-- Execute no SQL Editor do Supabase

-- ============================================
-- 1. HABILITAR AUTENTICAÇÃO POR EMAIL/SENHA
-- ============================================
-- No Dashboard do Supabase:
-- 1. Vá em Authentication > Providers
-- 2. Habilite "Email" provider
-- 3. Configure as opções conforme necessário

-- ============================================
-- 2. CRIAR USUÁRIO ADMINISTRADOR
-- ============================================
-- Você pode criar usuários de duas formas:

-- OPÇÃO A: Pelo Dashboard do Supabase
-- 1. Vá em Authentication > Users
-- 2. Clique em "Add user" > "Create new user"
-- 3. Preencha:
--    - Email: admin@vidacantina.com (ou o email que preferir)
--    - Password: (defina uma senha forte)
--    - Auto Confirm User: Marque esta opção
-- 4. Clique em "Create user"

-- OPÇÃO B: Via SQL (após criar o primeiro usuário manualmente)
-- Use a função abaixo apenas se já tiver um usuário criado

-- ============================================
-- 3. POLÍTICAS RLS (Row Level Security)
-- ============================================
-- As políticas RLS já estão configuradas no schema.sql
-- Elas permitem todas as operações para usuários autenticados

-- ============================================
-- 4. CONFIGURAÇÕES ADICIONAIS
-- ============================================
-- No Dashboard do Supabase:
-- 1. Vá em Authentication > URL Configuration
--    - Site URL: http://localhost:5173 (para desenvolvimento)
--    - Redirect URLs: Adicione http://localhost:5173/**
-- 
-- 2. Vá em Authentication > Email Templates
--    - Personalize os templates de email se desejar
--    - Ou desabilite emails de confirmação para desenvolvimento

-- ============================================
-- FIM DO SCRIPT
-- ============================================

