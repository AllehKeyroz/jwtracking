# KDS TRACKER - DOCUMENTAÇÃO COMPLETA DO PROJETO

## ÍNDICE
1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitetura do Sistema](#3-arquitetura-do-sistema)
4. [Banco de Dados (Prisma/SQLite)](#4-banco-de-dados-prismasqlite)
5. [Autenticação e Multi-Tenancy](#5-autenticação-e-multi-tenancy)
6. [Sistema de Rastreamento](#6-sistema-de-rastreamento)
7. [Fingerprints e Device Matching](#7-fingerprints-e-device-matching)
8. [Integrações WhatsApp](#8-integrações-whatsapp)
9. [Motor de IA (Intelligence Engine)](#9-motor-de-ia-intelligence-engine)
10. [Dashboard e UI](#10-dashboard-e-ui)
11. [API Routes](#11-api-routes)
12. [Scripts de Tracking](#12-scripts-de-tracking)
13. [Fluxo de Dados Completo](#13-fluxo-de-dados-completo)
14. [Configurações e Variáveis de Ambiente](#14-configurações-e-variáveis-de-ambiente)
15. [Implantação (Docker/Vercel)](#15-implantação-dockervercel)

---

## 1. VISÃO GERAL DO PROJETO

### Nome do Projeto
**KDS Tracker** (também chamado de "God Mode" ou "Master Tracker")

### Descrição
Plataforma SaaS de rastreamento first-party e identity bridging para marketing digital. A ferramenta conecta anúncios (Facebook/Meta Ads, Google Ads) diretamente às vendas no WhatsApp, utilizando técnicas avançadas de fingerprinting de hardware para identificar usuários de forma pseudo-anônima.

### Problema que Resolve
- **Atribuição de leads**: Saber exatamente qual campanha, anúncio e palavra-chave trouxe o cliente para o WhatsApp
- **Superar bloqueios**: Não depende de ferramentas vulneráveis a bloqueios de navegadores (como cookies third-party bloqueados pela Apple/Google)
- **First-party tracking**: Coleta dados próprios via fingerprinting WebGL/Canvas

### Público-Alvo
- Agências de marketing digital
- E-commerces que vendem via WhatsApp
- Infoprodutores eLaunchers

---

## 2. STACK TECNOLÓGICO

### Frontend
- **Framework**: Next.js 16.1.6 (App Router)
- **React**: 19.2.3
- **Styling**: TailwindCSS 4 + CSS customizado com variáveis CSS
- **UI Components**: Radix UI (shadcn-style)
- **Ícones**: Lucide React
- **Animações**: Framer Motion
- **Tipografia**: Google Fonts (Inter)

### Backend
- **Runtime**: Node.js
- **API**: Next.js API Routes / Server Actions
- **ORM**: Prisma Client
- **Banco de Dados**: SQLite (dev) / PostgreSQL (produção recomendada)
- **Autenticação**: NextAuth.js v4 com Credentials Provider
- **Hashing**: bcryptjs

### Integrações Externas
- **WhatsApp APIs**:
  - Evolution API (instâncias Baileys)
  - WhatsApp Business API (WABA/Meta Cloud API)
- **AI Providers**:
  - Google Gemini AI
  - OpenRouter (agregador de LLMs)
- **Firebase** (opcional):
  - Firestore (para analytics em tempo real)
  - Realtime Database
  - Authentication

### DevOps
- **Containerização**: Docker (multi-stage build)
- **Deploy**: Vercel (recomendado) ou Docker standalone

---

## 3. ARQUITETURA DO SISTEMA

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USUÁRIO/CLIENTE                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ Landing Page │  │  Meta Ads    │  │  Google Ads  │                 │
│  │ c/ tracker.js│  │  (fbclid)   │  │   (gclid)   │                 │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                 │
│         │                  │                  │                         │
│         └──────────────────┼──────────────────┘                         │
│                            ▼                                            │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │              PIXEL KDS TRACKER (tracker.js)                   │      │
│  │  - Captura fingerprint (WebGL, Canvas, Screen)               │      │
│  │  - Extrai parâmetros UTM (utm_source, utm_campaign)         │      │
│  │  - Captura fbclid/gclid                                     │      │
│  │  - Armazena cookie first-party                              │      │
│  └─────────────────────────────┬────────────────────────────────┘      │
│                                ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │              API /kds/[slug] (Tracking Portal)              │      │
│  │  - Registra clique no banco                                 │      │
│  │  - Captura fingerprint do dispositivo                        │      │
│  │  - Redireciona para WhatsApp/ destino final                 │      │
│  └─────────────────────────────┬────────────────────────────────┘      │
│                                ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │                   NEXTAUTH (JWT Session)                     │      │
│  │  - Autenticação via credenciais                             │      │
│  │  - Multi-tenancy via workspaceId                            │      │
│  └─────────────────────────────┬────────────────────────────────┘      │
│                                ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │                    DASHBOARD (React)                        │      │
│  │  - Visão Geral                                               │      │
│  │  - Links de Rastreio                                         │      │
│  │  - Leads & CRM                                               │      │
│  │  - Conversas (WhatsApp)                                      │      │
│  │  - Analytics                                                 │      │
│  │  - Integrações (Evolution/WABA)                              │      │
│  │  - Configurações (IA, Workspace)                             │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                         │
│  ════════════════════════════════════════════════════════════════════  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │              WHATSAPP WEBHOOKS                               │      │
│  │                                                               │      │
│  │  ┌────────────────────┐      ┌────────────────────┐         │      │
│  │  │  Evolution API     │      │   WABA (Meta)      │         │      │
│  │  │  Webhook           │      │   Webhook          │         │      │
│  │  │  /api/webhooks/    │      │   /api/webhooks/   │         │      │
│  │  │  evolution         │      │   waba            │         │      │
│  │  └─────────┬──────────┘      └─────────┬──────────┘         │      │
│  │            │                            │                     │      │
│  │            └──────────────┬─────────────┘                     │      │
│  │                           ▼                                    │      │
│  │  ┌──────────────────────────────────────────────────────┐     │      │
│  │  │            IDENTITY MATCHER                            │     │      │
│  │  │  - Cruza fingerprint com número WhatsApp             │     │      │
│  │  │  - Matching fuzzy de hardware                        │     │      │
│  │  │  - Micro-Bot (fallback para match falho)            │     │      │
│  │  └─────────────────────────────┬────────────────────────┘     │      │
│  │                                ▼                              │      │
│  │  ┌──────────────────────────────────────────────────────┐     │      │
│  │  │         INTELLIGENCE ENGINE (AI)                      │     │      │
│  │  │  - Análise de conversas via Gemini/OpenRouter        │     │      │
│  │  │  - Classificação de leads (Quente/Morno/Frio/Morto) │     │      │
│  │  │  - Detecção de fechamento de venda                   │     │      │
│  │  │  - Estimativa de valor                               │     │      │
│  │  └──────────────────────────────────────────────────────┘     │      │
│  │                                                                 │      │
│  └─────────────────────────────────────────────────────────────────┘
│                                                                         │
│  ════════════════════════════════════════════════════════════════════  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │                    BANCO DE DADOS                             │      │
│  │                                                               │      │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │      │
│  │  │   SQLite    │  │  PostgreSQL │  │   Firebase  │           │      │
│  │  │  (Local)   │  │ (Produção)  │  │ (Opcional)  │           │      │
│  │  │ godmode.db │  │  RECOMENDADO│  │  Analytics  │           │      │
│  │  └─────────────┘  └─────────────┘  └─────────────┘           │      │
│  └──────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Estrutura de Pastas

```
/config/workspace/Kds-Tracker/
├── prisma/
│   └── schema.prisma          # Definição do banco de dados
│   └── godmode.db            # Banco SQLite (desenvolvimento)
├── public/
│   ├── tracker.js            # Pixel de rastreamento para landing pages
│   └── *.svg                 # Ícones públicos
├── src/
│   ├── app/
│   │   ├── api/              # API Routes
│   │   │   ├── auth/         # NextAuth
│   │   │   ├── webhooks/      # Webhooks WhatsApp
│   │   │   ├── links/         # Link shortening
│   │   │   ├── t/            # Tracking
│   │   │   └── setup/        # Setup inicial
│   │   ├── dashboard/        # Área administrativa
│   │   │   ├── page.tsx      # Dashboard principal
│   │   │   ├── leads/        # CRM de leads
│   │   │   ├── links/        # Gerenciamento de links
│   │   │   ├── conversations/# Chat WhatsApp
│   │   │   ├── analytics/    # Analytics de tracking
│   │   │   ├── integrations/ # Evolution/WABA
│   │   │   ├── logs/         # Logs de webhooks
│   │   │   └── settings/     # Configurações
│   │   ├── kds/[slug]/       # Portal de rastreamento
│   │   ├── go/[slug]/        # Redirecionamento
│   │   ├── login/            # Página de login
│   │   ├── layout.tsx        # Layout raiz
│   │   └── page.tsx          # Landing page pública
│   ├── components/           # Componentes React reutilizáveis
│   │   ├── Sidebar.tsx
│   │   ├── LeadHistoryModal.tsx
│   │   └── IntegrationDocs.tsx
│   └── lib/                  # Bibliotecas e utilitários
│       ├── auth.ts           # Configuração NextAuth
│       ├── prisma.ts         # Cliente Prisma singleton
│       ├── utils.ts          # Utilitários Tailwind
│       ├── tracking-client.ts # Client-side fingerprinting
│       ├── identity-matcher.ts# Algoritmo de matching
│       ├── message-history.ts # Armazenamento de mensagens
│       ├── micro-bot.ts      # Bot de fallback
│       ├── gemini.ts         # Integração Gemini
│       ├── ai-master.ts      # Orquestrador de IA
│       ├── ai-orchestrator.ts# Orquestrador com fallback
│       ├── intelligence-engine.ts# Motor de IA
│       ├── webhook-logger.ts # Logger de webhooks
│       └── firebase/         # Integração Firebase
├── Dockerfile                # Container Docker
├── docker-compose.yml        # Orquestração Docker
├── next.config.ts           # Configuração Next.js
├── package.json             # Dependências npm
├── tsconfig.json            # Configuração TypeScript
└── tailwind.config.ts       # Configuração Tailwind
```

---

## 4. BANCO DE DADOS (PRISMA/SQLITE)

### Schema do Prisma

O banco de dados é composto por **10 modelos principais** que sustentam toda a lógica de multi-tenancy, rastreamento e CRM.

#### 4.1 Modelos de Sistema e Autenticação

**User** (Usuários)
```
- id: String (cuid) - Identificador único
- name: String? - Nome do usuário
- email: String (unique) - Email (login)
- password: String - Hash bcrypt
- createdAt: DateTime - Data de criação
- workspaces: WorkspaceUser[] - Relação many-to-many
```

**Workspace** (Espaços de Trabalho/Multi-Tenancy)
```
- id: String (cuid)
- name: String - Nome da empresa/cliente
- customDomain: String? - Domínio customizado (track.loja.com)
- geminiApiKey: String? - API Key do Gemini (por workspace)
- geminiModel: String? - Modelo Gemini (default: gemini-3-flash-latest)
- openRouterKey: String? - API Key OpenRouter
- openRouterModel: String? - Modelo OpenRouter
- createdAt: DateTime
- updatedAt: DateTime
- users: WorkspaceUser[]
- whatsappConnections: WhatsAppConnection[]
- shortLinks: ShortLink[]
- adAccounts: AdAccount[]
- clicks: ClickSession[]
- leads: LeadIdentity[]
- messages: Message[]
- webhookLogs: WebhookLog[]
```

**WorkspaceUser** (Relacionamento N:N)
```
- userId: String (PK)
- workspaceId: String (PK)
- role: String (OWNER | MEMBER)
```

#### 4.2 Modelos de WhatsApp

**WhatsAppConnection** (Conexões WhatsApp)
```
- id: String (cuid)
- workspaceId: String (FK)
- name: String - Nome amigável
- provider: String - "EVOLUTION" ou "WABA"
- instanceId: String? - ID da instância/API
- token: String? - Token/API Key
- isActive: Boolean
- createdAt: DateTime
- messages: Message[]
```

#### 4.3 Modelos de Rastreamento

**ShortLink** (Links Encurtados)
```
- id: String (cuid)
- workspaceId: String (FK)
- slug: String (unique) - Ex: "loja.vip"
- destinationUrl: String - URL final
- rotatorUrls: String? - URLs round-robin (separadas por vírgula)
- rotatorIndex: Int - Posição atual do roteador
- isActive: Boolean
- clicksCount: Int - Cache de cliques
- createdAt: DateTime
```

**DeviceFingerprint** (Impressões Digitais de Hardware)
```
- id: String (PK) - Hash do fingerprint
- ipAddress: String?
- gpuVendor: String? - Fabricante da GPU
- screenResolution: String? - Resolução da tela
- userAgent: String?
- browser: String?
- os: String? - Sistema operacional
- deviceType: String? - Mobile/Desktop
- deviceModel: String? - Modelo do dispositivo
- language: String?
- timezone: String?
- cores: Int? - Núcleos da CPU
- memory: Int? - Memória RAM
- lastSeen: DateTime
- clicks: ClickSession[]
```

**ClickSession** (Sessões de Clique)
```
- id: String (cuid)
- workspaceId: String (FK)
- linkSlug: String? - Slug do link clicado
- fingerprintHash: String - FK para DeviceFingerprint
- clickId: String? - fbclid, gclid, etc
- trafficSource: String? - utm_source (Facebook, Google, etc)
- utmMedium: String?
- utmCampaign: String?
- utmTerm: String?
- utmContent: String?
- clickedAt: DateTime
- workspace: Workspace
- fingerprint: DeviceFingerprint
```

**AdAccount** (Contas de Anúncios - Futuro)
```
- id: String (cuid)
- workspaceId: String (FK)
- platform: String - "META"
- pixelId: String?
- accessToken: String?
```

#### 4.4 Modelos de CRM e Mensagens

**LeadIdentity** (Identidade do Lead)
```
- id: String (PK) - Telefone formatado (+55...)
- workspaceId: String (FK)
- name: String?
- score: Float - Lifetime Value (default: 0)
- matchedHash: String? - Hash de hardware relacionado

# Campos de IA (análise de conversa)
- aiIntentLevel: String? - "Quente", "Morno", "Frio", "Morto"
- aiDealClosed: Boolean?
- aiValueFloat: Float? - Valor estimado da venda
- aiLossReason: String? - Motivo da perda
- avatarUrl: String?
- lastAiAnalysis: DateTime?

- createdAt: DateTime
- workspace: Workspace
- messages: Message[]
```

**Message** (Mensagens WhatsApp)
```
- id: String (cuid)
- workspaceId: String (FK)
- leadId: String (FK)
- connectionId: String? (FK)
- direction: String - "INBOUND" ou "OUTBOUND"
- type: String - "TEXT", "IMAGE", "AUDIO", "DOCUMENT"
- content: String? - Texto da mensagem
- mediaUrl: String?
- rawPayload: String? - Payload JSON original (debug)
- status: String - "SENT", "DELIVERED", "READ", "FAILED"
- externalId: String? - ID do provedor
- timestamp: DateTime
```

**WebhookLog** (Logs de Webhooks)
```
- id: String (cuid)
- workspaceId: String?
- provider: String - "WABA" ou "EVOLUTION"
- event: String? - Nome do evento
- payload: String - JSON completo
- createdAt: DateTime
```

---

## 5. AUTENTICAÇÃO E MULTI-TENANCY

### 5.1 NextAuth Configuration

O sistema usa **NextAuth.js v4** com Credentials Provider para autenticação por email/senha.

**Arquivo**: `src/lib/auth.ts`

```typescript
// Configurações principais:
- providers: CredentialsProvider (email + password)
- session: strategy "jwt" (30 dias)
- callbacks: jwt + session (inclui workspaceId e role)
- pages: signIn redireciona para /login
```

### 5.2 Estrutura de Sessão

```typescript
interface Session {
  user: {
    id: string           // ID do usuário
    workspaceId: string // Workspace ativo
    role: string        // OWNER ou MEMBER
    name?: string
    email?: string
  }
}
```

### 5.3 Middleware de Proteção

Todas as páginas do dashboard (`/dashboard/*`) são protegidas pelo `DashboardLayout`:

```typescript
// src/app/dashboard/layout.tsx
const session = await getServerSession(authOptions);
if (!session) redirect('/login');
```

### 5.4 Multi-Tenancy

Cada usuário pode pertencer a múltiplos workspaces (relação N:N), mas para o MVP, apenas o primeiro workspace é utilizado como "ativo".

```typescript
// Ao fazer login, o workspace ativo é definido como:
workspaceId: user.workspaces[0].workspaceId
role: user.workspaces[0].role
```

Todas as queries do Prisma incluem filtro por `workspaceId` para garantir isolamento de dados.

---

## 6. SISTEMA DE RASTREAMENTO

### 6.1 Fluxo de Rastreamento

```
1. Usuário clica em anúncio (Facebook/Google)
   ↓ (com fbclid/gclid/utm_*)
2. Aterrissa na landing page com tracker.js
   ↓
3. Pixel captura fingerprint + parâmetros
   ↓
4. Navega para /kds/[slug]
   ↓
5. Server captura fingerprint + redireciona
   ↓
6. Usuário vai para WhatsApp
   ↓
7. Usuário envia mensagem
   ↓
8. Webhook recebe mensagem
   ↓
9. Identity Matcher cruza dados
   ↓
10. Lead é "mapeado" ao clique original
```

### 6.2 Pixel de Rastreamento (tracker.js)

**Arquivo**: `public/tracker.js` e `src/app/api/px.js/route.ts`

Funcionalidades:
- Captura fingerprint via WebGL (GPU vendor/renderer)
- Extrai parâmetros UTM da URL
- Captura fbclid/gclid
- Gera UUID para cookie first-party
- Dispara POST para `/api/trc/collect`
- Hook de cliques em links WhatsApp (wa.me)

```javascript
// Payload enviado:
{
  cookie_id: UUID,
  fingerprint_hash: SHA256_HASH_16CHARS,
  browser_url: window.location.href,
  gpu_vendor: "NVIDIA GeForce RTX 3080",
  screen_resolution: "1920x1080",
  fbclid: "abc123...",
  gclid: undefined,
  utm_source: "facebook",
  utm_campaign: "black_friday",
  utm_medium: "cpc",
  workspace_key: "DEV_WORKSPACE"
}
```

### 6.3 Portal de Rastreamento (/kds/[slug])

**Arquivo**: `src/app/kds/[slug]/page.tsx` e `PortalClient.tsx`

1. Busca link no banco de dados
2. Executa round-robin se configurado
3. Client-side: captura fingerprint adicional
4. Registra clique no banco via Server Action
5. Redireciona para destino final

### 6.4 Link Encurtador (/go/[slug])

**Arquivo**: `src/app/go/[slug]/page.tsx`

- Rota alternativa para rastreamento
- Suporta link de autenticação (Micro-Bot)
- Extrai fingerprint do navegador
- Integra com `/api/links/[slug]` para resolver destino

### 6.5 API de Tracking

**Rota**: `POST /api/t`

```typescript
// Input:
{
  fingerprint_hash: string,
  gpu_vendor: string,
  screen_resolution: string,
  fbclid?: string,
  gclid?: string,
  utm_source?: string,
  utm_campaign?: string,
  workspace_key: string
}

// Output:
{ status: 'Tracked', hash: string }
```

---

## 7. FINGERPRINTS E DEVICE MATCHING

### 7.1 Algoritmo de Fingerprinting

**Arquivo**: `src/lib/tracking-client.ts` (client-side)

Componentes do fingerprint:
1. **GPU Vendor/Renderer** - Via WebGL debug info
2. **Screen Resolution** - Dimensões + devicePixelRatio
3. **User Agent** - Navegador e SO
4. **Hardware Concurrency** - Número de núcleos CPU
5. **Device Memory** - RAM (se disponível)

```typescript
// Hash gerado: fp_{gpu8chars}_{resolution}_{deviceModel}
// Exemplo: fp_nvidia308_1920x1080_iphone15pro
```

### 7.2 Identity Matcher (Fuzzy Hardware Matching)

**Arquivo**: `src/lib/identity-matcher.ts`

O algoritmo central que "amarra" um número WhatsApp ao fingerprint:

```typescript
async function processIncomingLead(
  workspaceId: string,
  phone: string,          // +55XXXXXXXXXXX
  contactName: string?,
  messageBody: string?,
  connectionId: string,
  provider: 'EVOLUTION' | 'WABA',
  avatarUrl: string?
)
```

**Lógica:**
1. Cria/atualiza LeadIdentity (upsert)
2. Verifica se já tem `matchedHash` (se sim, retorna)
3. Busca cliques recentes (últimos 30 minutos)
4. Se encontrar clique: amarra `matchedHash`
5. Se NÃO encontrar: aciona Micro-Bot (fallback)

### 7.3 Janela de Match

```
Janela de 30 minutos após clique
├── Cliques capturados via pixel
├── Armazenados em ClickSession
└── Comparados com mensagem WhatsApp
```

### 7.4 Micro-Bot (Fallback)

**Arquivo**: `src/lib/micro-bot.ts`

Quando o match passivo falha (lead clicou mas hash não foi capturado):

1. Envia mensagem automática com link de "validação"
2. Link `/go/auth-{base64(phone)}`
3. Quando aberto no WhatsApp WebView:
   - Captura fingerprint
   - Envia para `/api/t/auth`
   - Amarra hash ao lead

---

## 8. INTEGRAÇÕES WHATSAPP

### 8.1 Evolution API

**Arquivo**: `src/app/dashboard/integrations/evolution/`

#### Gateway Master
A conexão "master" armazena URL + API Key da Evolution:

```typescript
// Token formatado: "https://evo.server.com|B629X1..."
const [url, apiKey] = connection.token.split('|');
```

#### Funcionalidades
- Criar instâncias automaticamente
- Gerar QR Code para pareamento
- Definir webhook automaticamente
- Sincronizar instâncias existentes
- Verificar status de conexão

#### Endpoints Evolution Utilizados
```
POST /instance/create
POST /instance/connect/{instanceName}
GET  /instance/connectionState/{instanceName}
DELETE /instance/delete/{instanceName}
GET  /instance/fetchInstances
POST /webhook/set/{instanceName}
POST /chat/fetchProfilePictureUrl/{instanceName}
POST /chat/findContacts/{instanceName}
POST /message/sendText/{instanceName}
```

### 8.2 WhatsApp Business API (WABA)

**Arquivo**: `src/app/dashboard/integrations/waba/`

Integração oficial Meta Cloud API:
- Phone Number ID (instanceId)
- Permanent System User Token
- Webhook para receber mensagens

### 8.3 Webhook Evolution

**Rota**: `POST /api/webhooks/evolution`

```typescript
// Parâmetros via query: ?workspaceKey=xxx
// Eventos suportados: messages.upsert, MESSAGES_UPSERT
```

**Processamento:**
1. Log do payload
2. Validação de workspace/connection
3. Extração de dados da mensagem
4. Identificação de tipo (TEXT, IMAGE, AUDIO, etc)
5. Extração de pushName/foto
6. Armazenamento em Message
7. Chama Identity Matcher (se INBOUND)

### 8.4 Webhook WABA

**Rota**: `POST /api/webhooks/waba`

- GET: Verificação do webhook (hub.verify_token)
- POST: Processamento de mensagens

### 8.5 Armazenamento de Mensagens

**Arquivo**: `src/lib/message-history.ts`

```typescript
async function saveMessageToHistory(
  workspaceId: string,
  leadId: string,
  connectionId: string,
  direction: 'INBOUND' | 'OUTBOUND',
  type: string,
  content: string,
  externalId?: string,
  contactName?: string,
  avatarUrl?: string,
  rawPayload?: string
)
```

---

## 9. MOTOR DE IA (INTELLIGENCE ENGINE)

### 9.1 Arquitetura

O sistema usa **fallback** entre provedores de IA:

```
OpenRouter (prioridade)
    ↓ (se falhar)
Gemini (fallback)
    ↓ (se falhar)
Erro
```

### 9.2 Provedores Suportados

**Google Gemini**
- Arquivo: `src/lib/gemini.ts`
- Modelos: gemini-3-flash-latest, gemini-2.5-flash, etc
- Requer: `GEMINI_API_KEY` no workspace

**OpenRouter**
- Arquivo: `src/lib/ai-master.ts`
- Modelos gratuitos: google/gemini-2.0-flash:free, deepseek/deepseek-r1-0528:free
- Requer: `OPENROUTER_API_KEY` no workspace

### 9.3 Análise de Conversa

**Prompt para IA:**
```
Analise o histórico de conversa e extraia:
{
  "intentLevel": "Quente" | "Morno" | "Frio" | "Morto",
  "dealClosed": boolean,
  "valueFloat": number,
  "lossReason": string
}
```

### 9.4 Intelligence Engine

**Arquivo**: `src/lib/intelligence-engine.ts`

```typescript
async function processLeadIntelligence(
  workspaceId: string,
  leadId: string,
  currentContent?: string
)
```

**Critérios para disparar análise:**
- +8 mensagens novas desde última análise
- OU keyword "quente" (pagar, pix, fechar)
- OU +24h desde última análise

### 9.5 Campos de IA no Lead

```typescript
lead.aiIntentLevel   // "Quente" | "Morno" | "Frio" | "Morto"
lead.aiDealClosed    // boolean
lead.aiValueFloat    // Valor estimado
lead.aiLossReason    // Motivo da perda
lead.lastAiAnalysis  // Timestamp
```

---

## 10. DASHBOARD E UI

### 10.1 Páginas do Dashboard

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/dashboard` | `page.tsx` | Visão geral com métricas |
| `/dashboard/leads` | `LeadsView.tsx` | CRM de leads |
| `/dashboard/links` | `LinksView.tsx` | Links de rastreio |
| `/dashboard/links/new` | `NewTrackLinkPage.tsx` | Criar novo link |
| `/dashboard/conversations` | `ChatView.tsx` | Chat WhatsApp |
| `/dashboard/analytics` | `TrackingAnalyticsView.tsx` | Monitor de atribuição |
| `/dashboard/integrations` | `IntegrationsPage.tsx` | Lista de integrações |
| `/dashboard/integrations/evolution` | `EvolutionDashboard.tsx` | Evolution API |
| `/dashboard/integrations/waba` | `WabaClient.tsx` | WABA Cloud API |
| `/dashboard/logs` | `LogsView.tsx` | Logs de webhooks |
| `/dashboard/settings` | `SettingsView.tsx` | Configurações de IA |

### 10.2 Sidebar

**Arquivo**: `src/components/Sidebar.tsx`

Menu de navegação com ícones Lucide:
- Visão Geral
- Links de Rastreio
- Monitor de Atribuição
- Leads & CRM
- Conversas
- Integrações (Webhooks)
- Logs de Webhook
- Configurações
- Sair

### 10.3 Componentes Principais

**LeadHistoryModal** (`LeadHistoryModal.tsx`)
- Timeline de cliques do lead
- Dados UTM
- Origem do tráfego

**IntegrationDocs** (`IntegrationDocs.tsx`)
- Guias passo-a-passo para WABA e Evolution
- Componentes colapsáveis

### 10.4 Estilização

- **Tema**: Dark mode por padrão
- **Cores primárias**: Cyan (#06b6d4), Purple (#8b5cf6)
- **Glassmorphism**: Backgrounds com blur e transparência
- **Animações**: Framer Motion para transições

---

## 11. API ROUTES

### 11.1 Rotas de Autenticação

```
GET/POST /api/auth/[...nextauth]
- Handler NextAuth para login/logout
```

### 11.2 Rotas de Tracking

```
POST /api/t
- Coleta dados de clique
- Cria/atualiza fingerprint
- Cria ClickSession

POST /api/t/auth
- Autenticação In-App WebView
- Amarra phone a fingerprint

POST /api/trc/collect
- Coleta via Firebase (opcional)
- Suporta eventos WA_CLICK
```

### 11.3 Rotas de Links

```
GET /api/links/[slug]
- Retorna destino do link
- Executa round-robin
- Incrementa contador
```

### 11.4 Rotas de Webhooks

```
POST /api/webhooks/evolution
- Recebe mensagens da Evolution API
- Processa identity matching

GET/POST /api/webhooks/waba
- Recebe mensagens do WABA Meta
- Verificação de webhook
```

### 11.5 Rotas de Setup

```
GET /api/setup
- Cria workspace e admin inicial
- Executa seed do banco
```

### 11.6 Script Dinâmico

```
GET /api/px.js
- Retorna pixel de rastreamento
- Cache: 1 hora
```

---

## 12. SCRIPTS DE TRACKING

### 12.1 tracker.js (Client-Side)

**Instalação na landing page:**
```html
<script src="https://seu-dominio.com/tracker.js" data-workspace="WORKSPACE_ID"></script>
```

**Funcionalidades:**
- Geração de UUID para cookie
- Fingerprint via WebGL
- Extração de parâmetros UTM
- Disparo para API de coleta

### 12.2 Pixel Server-Side

**Rota**: `/api/px.js`

Retorna JavaScript dinamicamente:
```javascript
(function(window, document) {
  // Gera fingerprint
  // Captura UTMs
  // Dispara POST para /api/trc/collect
})();
```

---

## 13. FLUXO DE DADOS COMPLETO

### 13.1 Fluxo 1: Rastreamento de Clique

```
1. Usuário clica em anúncio Facebook
   └─ URL: https://landing.com/?utm_source=facebook&utm_campaign=black_friday&fbclid=abc123

2. Landing page carrega
   └─ tracker.js executa
   └─ Captura fingerprint: "fp_nvidia308_1920x1080_iphone15pro"
   └─ Extrai fbclid + UTMs

3. Usuário navega para link KDS
   └─ URL: https://kds-tracker.com/kds/promo-black-friday

4. Portal de rastreamento (/kds/promo-black-friday)
   └─ Busca link no banco
   └─ Client captura fingerprint adicional
   └─ POST /kds/actions → registerClick()
   └─ Registra ClickSession com fingerprint + UTMs
   └─ Redireciona para WhatsApp

5. Usuário vai para WhatsApp
   └─ URL: https://wa.me/5511999999999?text=Olá

6. Usuário envia mensagem
```

### 13.2 Fluxo 2: Recebimento de WhatsApp

```
1. Evolution API recebe mensagem
   └─ POST /api/webhooks/evolution?workspaceKey=xxx

2. Webhook procesa payload
   └─ Extrai número, nome, conteúdo
   └─ saveMessageToHistory() → Message
   └─ processIncomingLead()

3. Identity Matcher
   └─ Verifica se lead já tem matchedHash
   └─ Busca cliques recentes (30 min)
   └─ Se encontrar: amarra hash ao lead
   └─ Se não: aciona Micro-Bot

4. Micro-Bot (se necessário)
   └─ Envia link de validação
   └─ Link: https://kds-tracker.com/go/auth-BASE64PHONE

5. Lead abre link (WebView)
   └─ Captura fingerprint
   └─ POST /api/t/auth
   └─ Amarra definitivamente
```

### 13.3 Fluxo 3: Análise de IA

```
1. Nova mensagem chega
   └─ saveMessageToHistory()
   └─ Chama processLeadIntelligence() em background

2. Intelligence Engine
   └─ Verifica critérios (8+ msgs, keywords, 24h)
   └─ Se não atender: exit

3. Prepara histórico
   └─ Busca mensagens do lead
   └─ Formata para prompt da IA

4. Executa análise
   └─ OpenRouter (prioridade)
   └─ Gemini (fallback)

5. Atualiza lead
   └─ aiIntentLevel
   └─ aiDealClosed
   └─ aiValueFloat
   └─ aiLossReason
```

---

## 14. CONFIGURAÇÕES E VARIÁVEIS DE AMBIENTE

### 14.1 Arquivo .env

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua_chave_secreta_super_segura

# Prisma
DATABASE_URL="file:./dev.db"

# Firebase (opcional)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=

# Gemini (opcional - pode ser configurado por workspace)
# GEMINI_API_KEY=
```

### 14.2 Modelos de IA por Workspace

Cada workspace pode ter suas próprias chaves de API:

```typescript
interface WorkspaceAI {
  geminiApiKey?: string
  geminiModel?: string    // default: gemini-3-flash-latest
  openRouterKey?: string
  openRouterModel?: string // default: xiaomi/mimo-v2-flash:free
}
```

### 14.3 Setup Inicial

Acesse `/api/setup` (apenas uma vez) para criar:
- Workspace master
- Usuário admin (admin@kdstracker.com / SenhaMestra123)
- Link de exemplo ("zap")

---

## 15. IMPLANTAÇÃO (DOCKER/VERCEL)

### 15.1 Dockerfile

```dockerfile
FROM node:20-alpine AS base

# Dependências
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Produção
FROM base AS runner
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["node", "server.js"]
```

### 15.2 Build para Produção

```bash
# Gerar cliente Prisma
npx prisma generate

# Build Next.js
npm run build

# Gerar migration (se necessário)
npx prisma migrate deploy
```

### 15.3 Variáveis de Produção

```env
NODE_ENV=production
DATABASE_URL="file:./prod.db"  # ou URL PostgreSQL
NEXTAUTH_URL="https://seu-dominio.com"
NEXTAUTH_SECRET="[GERAR_CHAVE_SEGURA]"
```

---

## 16. ENDPOINTS DA API (RESUMO)

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/auth/[...nextauth] | Status auth |
| POST | /api/auth/[...nextauth] | Login/logout |

### Tracking
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | /api/t | Registrar clique |
| POST | /api/t/auth | Autenticação In-App |
| POST | /api/trc/collect | Coleta Firebase |
| GET | /api/px.js | Pixel JS |

### Links
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/links/[slug] | Resolver link |
| GET | /kds/[slug] | Portal tracking |
| GET | /go/[slug] | Redirecionamento |

### Webhooks
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | /api/webhooks/evolution | Evolution API |
| GET/POST | /api/webhooks/waba | WABA Meta |

### Setup
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/setup | Setup inicial |

---

## 17. SEGURANÇA E PRIVACIDADE

### 17.1 Armazenamento de Dados
- Senhas: Hash bcrypt com salt
- Tokens API: Armazenados encrypted
- Dados de fingerprint: Hash irreversível

### 17.2 Multi-Tenancy
- Todas as queries filtradas por workspaceId
- Webhooks validados contra workspace
- Logs isolados por workspace

### 17.3 Headers de Segurança
- CORS configurado para tracking (cross-origin)
- Cookies: SameSite=Lax, Secure em produção

---

## 18. MELHORIAS FUTURAS (ROADMAP)

Conforme comentários no código:
- **Fase 6**: Meta Ads Offline Conversions (CAPI)
- Suporte a múltiplos workspaces por usuário
- Dashboard de ROI por campanha
- Integração com Google Analytics 4
- webhooks para Slack/Discord
- Exportação de relatórios PDF

---

## 19. DEBUGGING E TROUBLESHOOTING

### 19.1 Logs Importantes

```bash
# Identity Matching
console.log(`[IDENTITY MATCHED] Lead ${phone} amarrado ao Hardware ${hash}`)
console.log(`[IDENTITY LOST] Lead ${phone} sem rastro do PIXEL`)

// Micro-Bot
console.log(`[MicroBot Trigger] Tentando forçar Fixação de Hash para ${phone}`)

// Webhooks
console.log(`--- [EVOLUTION WEBHOOK RECEBIDO] --- EVENTO: ${body?.event}`)
```

### 19.2 Logs de Erro

```bash
console.error('[KDS Tracker Error] Falha brutal no Identity Matcher:', err)
console.error('[MicroBot Error] Falha ao disparar resposta automática:', err)
console.error('[STORAGE Error] Falha ao arquivar mensagem', err)
```

### 19.3 Verificação de Conexões

```bash
# Evolution
GET /instance/connectionState/{instanceName}

# WABA
GET /api/webhooks/waba?hub.mode=subscribe&hub.verify_token=kds_waba_godmode
```

---

## 20. CRÉDITOS E CONTATO

**Desenvolvido como**: KDS Tracker / God Mode
**Stack**: Next.js 16 + Prisma + SQLite + TailwindCSS 4
**Versão**: 0.1.0

---

*Documentação gerada automaticamente a partir da análise do código fonte.*
*Última atualização: Abril 2026*
