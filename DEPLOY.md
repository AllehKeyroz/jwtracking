# KDS TRACKER - GUIA DE DEPLOY EASY PANEL

## REQUISITOS
- Node.js 20
- Git
- EasyPanel Account

---

## PASSO 1: Clone o Repositório

```bash
git clone <SEU_REPOSITORIO>
cd kds-tracker
```

---

## PASSO 2: Configure as Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="file:./prisma/godmode.db"
NEXTAUTH_URL="https://SUA-URL.easypanel.host"
NEXTAUTH_SECRET="uma-chave-secreta-minimo-32-caracteres"
```

**Para gerar uma NEXTAUTH_SECRET:**
- Acesse: https://generate-secret.vercel.app/
- Ou use: `openssl rand -base64 32`

---

## PASSO 3: Deploy no EasyPanel

### 3.1 Criar Nova Aplicação

1. Acesse https://easypanel.io
2. Clique em **New App**
3. Selecione **Custom App**
4. Conecte seu repositório Git

### 3.2 Configurações da Aplicação

| Campo | Valor |
|-------|-------|
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `node server.js` |
| **Port** | `3000` |
| **Health Check Path** | `/` |

### 3.3 Variáveis de Ambiente

Adicione estas variáveis no EasyPanel (Environment):

```
DATABASE_URL = file:./prisma/godmode.db
NEXTAUTH_URL = https://SUA-URL.easypanel.host
NEXTAUTH_SECRET = sua-chave-secreta
NODE_ENV = production
```

### 3.4 Volume Persistente (IMPORTANTE!)

1. Vá em **Storage** ou **Volumes**
2. Clique em **Add Persistent Storage**
3. Configure:

```
Name: kds-data
Mount Path: /app/prisma
Size: 1GB
```

> Isso garante que o banco SQLite não seja apagado ao reiniciar.

---

## PASSO 4: Deploy

1. Clique em **Deploy**
2. Aguarde o build terminar

---

## PASSO 5: Inicializar o Banco

Após o deploy, abra o **Terminal** do EasyPanel:

```bash
npx prisma db push
```

---

## PASSO 6: Criar Admin Inicial

No navegador, acesse:

```
https://SUA-URL.easypanel.host/api/setup
```

Deve retornar algo como:
```json
{"message":"Setup já realizado antes."}
```
ou criar o usuário.

---

## PASSO 7: Acessar o Dashboard

1. Acesse: `https://SUA-URL.easypanel.host/login`
2. Login com:

| Campo | Valor |
|-------|-------|
| **Email** | `admin@kdstracker.com` |
| **Senha** | `SenhaMestra123` |

---

## TROUBLESHOOTING

### Erro "address already in use"
- No EasyPanel, mude a porta de 80 para **3000**

### Erro "permission denied"
- Verifique se o volume persistente está configurado corretamente
- Tente dar permissão: `chmod 777 /app/prisma`

### Erro Prisma 7.x
- Certifique-se que o `package.json` tem `"prisma": "6.19.2"` (sem ^)
- Rebuild após qualquer mudança no package.json

### Banco vazio após restart
- O volume persistente `/app/prisma` não está configurado
- Delete a app e recrie seguindo o PASSO 3.4

---

## ESTRUTURA DO PROJETO

```
kds-tracker/
├── prisma/
│   └── schema.prisma     # Schema do banco
│   └── godmode.db        # Banco SQLite (criado após db push)
├── src/
│   ├── app/             # Next.js App Router
│   │   ├── api/         # API Routes
│   │   ├── dashboard/    # Páginas do dashboard
│   │   └── kds/[slug]/  # Portal de rastreio
│   └── lib/             # Bibliotecas
├── public/
│   └── tracker.js       # Pixel de rastreio
├── Dockerfile           # Container Docker
└── .env                 # Variáveis de ambiente
```

---

## COMANDOS ÚTEIS

```bash
# Gerar cliente Prisma
npx prisma generate

# Criar/atualizar banco
npx prisma db push

# Ver status do banco
npx prisma db status

# Resetar banco (DELETA TUDO)
npx prisma db push --force-reset
```

---

## CREDENCIAIS PADRÃO

| Campo | Valor |
|-------|-------|
| Email | `admin@kdstracker.com` |
| Senha | `SenhaMestra123` |

**⚠️ Mude a senha após o primeiro login!**
