# 🔐 Passo a Passo - Configuração de Autenticação (Conta Única)

Este guia irá te ajudar a configurar o sistema de autenticação para uma única conta de administrador.

---

## 📋 Pré-requisitos

- Conta no Supabase (gratuita)
- Projeto Supabase criado
- Variáveis de ambiente configuradas (`.env`)

---

## 🚀 Passo 1: Habilitar Autenticação no Supabase

### 1.1 Acessar o Dashboard

1. Acesse [https://supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione seu projeto

### 1.2 Habilitar Provider de Email

1. No menu lateral, clique em **Authentication**
2. Clique em **Providers**
3. Encontre o provider **Email**
4. Clique no toggle para **habilitar** (deve ficar verde)
5. Configure:
   - **Enable email confirmations**: ❌ **Desmarque** (não precisa confirmar email)
   - **Enable signup**: ❌ **Desmarque** (não permitir criar novas contas)
6. Clique em **Save**

---

## 👤 Passo 2: Criar a Conta Administradora

### 2.1 Criar Usuário

1. No menu lateral, clique em **Authentication**
2. Clique em **Users**
3. Clique no botão **Add user** (canto superior direito)
4. Selecione **Create new user**
5. Preencha os campos:
   - **Email**: Seu email (ex: `admin@vidacantina.com`)
   - **Password**: Defina uma senha forte
   - **Auto Confirm User**: ✅ **Marque esta opção** (importante!)
6. Clique em **Create user**

### 2.2 Anotar Credenciais

Guarde suas credenciais em local seguro:
- **Email**: `_________________`
- **Senha**: `_________________`

---

## ⚙️ Passo 3: Configurar URLs

### 3.1 Configurar Redirecionamento

1. No menu lateral, clique em **Authentication**
2. Clique em **URL Configuration**
3. Configure:
   - **Site URL**: `http://localhost:5173` (para desenvolvimento)
   - **Redirect URLs**: Adicione `http://localhost:5173/**`
4. Clique em **Save**

> **Para produção**: Quando fizer deploy, adicione também a URL de produção.

---

## 🧪 Passo 4: Testar o Login

### 4.1 Iniciar o Projeto

```bash
npm run dev
```

### 4.2 Fazer Login

1. Acesse `http://localhost:5173`
2. Você verá a tela de login
3. Use as credenciais criadas:
   - **Email**: O email que você criou
   - **Senha**: A senha que você definiu
4. Clique em **Entrar**

### 4.3 Verificar Funcionamento

- ✅ Você deve ser redirecionado para o Dashboard
- ✅ O nome do usuário deve aparecer no topo
- ✅ O botão "Sair" deve funcionar
- ✅ Ao recarregar a página, você permanece logado

---

## 🔒 Segurança

### Importante:

- ✅ **Apenas uma conta**: O sistema está configurado para uma única conta
- ✅ **Sem registro**: Não é possível criar novas contas pelo sistema
- ✅ **Senha forte**: Use uma senha com pelo menos 8 caracteres, incluindo letras, números e símbolos
- ✅ **Mantenha segredo**: Não compartilhe suas credenciais

### Para Alterar a Senha:

1. No Dashboard do Supabase
2. Vá em **Authentication** > **Users**
3. Encontre seu usuário
4. Clique nos três pontos (...)
5. Selecione **Reset password** ou **Update user**

---

## 🛠️ Solução de Problemas

### Problema: "Invalid login credentials"

**Solução:**
- Verifique se o email está correto
- Verifique se a senha está correta
- Verifique se o usuário está confirmado (deve ter "Confirmed" no status)

### Problema: "Email not confirmed"

**Solução:**
- No Dashboard do Supabase, vá em Authentication > Users
- Encontre o usuário
- Clique nos três pontos (...)
- Selecione "Confirm user"

### Problema: "Redirect URL not allowed"

**Solução:**
- Verifique se adicionou `http://localhost:5173/**` nas Redirect URLs
- Verifique se o Site URL está correto

---

## ✅ Checklist Final

- [ ] Provider de Email habilitado
- [ ] Signup desabilitado (não permitir criar contas)
- [ ] Conta administradora criada
- [ ] Auto Confirm User marcado
- [ ] Site URL configurado
- [ ] Redirect URLs configuradas
- [ ] Login testado com sucesso
- [ ] Logout funcionando
- [ ] Credenciais anotadas em local seguro

---

## 🎉 Pronto!

Seu sistema de autenticação está configurado para uma única conta!

**Lembre-se**: Este sistema é para uso com apenas uma conta. Não é possível criar novas contas pelo sistema.

Para dúvidas, consulte a [documentação do Supabase Auth](https://supabase.com/docs/guides/auth).
