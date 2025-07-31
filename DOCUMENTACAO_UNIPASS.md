# 📚 Documentação Completa - Sistema Unipass

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Instalação e Configuração](#instalação-e-configuração)
4. [Funcionalidades Implementadas](#funcionalidades-implementadas)
5. [Tipos de Usuários](#tipos-de-usuários)
6. [Guias de Uso](#guias-de-uso)
7. [API Documentation](#api-documentation)
8. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O **Unipass** é um sistema completo de gestão de check-ins em academias que oferece:

- ✅ **Check-in via QR Code** com validação por localização GPS
- 🏆 **Sistema de Gamificação** completo (pontos, conquistas, rankings)  
- 💳 **Gestão de Assinaturas** com planos flexíveis
- 📊 **Painel Administrativo** para gestão completa do sistema
- 🏢 **Dashboard para Academias** com controle de ocupação
- 📱 **PWA (Progressive Web App)** com funcionalidades offline
- 🔔 **Sistema de Notificações** push

---

## 🏗️ Arquitetura do Sistema

### Frontend (React + TypeScript)
```
frontend/
├── src/
│   ├── components/        # Componentes reutilizáveis
│   ├── pages/            # Páginas da aplicação
│   ├── contexts/         # Context API (Auth, App)
│   ├── services/         # Serviços (API, Location, PWA)
│   └── utils/           # Utilitários
```

### Backend (FastAPI + Python)
```
backend/
├── models/              # Modelos do banco de dados
├── routes/              # Rotas da API
├── schemas/             # Schemas Pydantic
├── utils/               # Utilitários (auth, config)
├── database/            # Configuração do banco
└── scripts/            # Scripts de inicialização
```

### Tecnologias Utilizadas
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: FastAPI, SQLAlchemy, Pydantic v2, Python-JOSE
- **Banco de Dados**: SQLite (desenvolvimento), PostgreSQL (produção)
- **Autenticação**: JWT com refresh tokens
- **PWA**: Service Workers, Web App Manifest

---

## ⚙️ Instalação e Configuração

### 1. Pré-requisitos
```bash
- Python 3.8+
- Node.js 16+
- npm ou yarn
```

### 2. Configuração do Backend
```bash
# Navegar para o diretório backend
cd backend

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env

# Inicializar banco e criar admin
python scripts/create_admin.py

# Iniciar servidor
python main.py
```

### 3. Configuração do Frontend
```bash
# Navegar para o diretório frontend  
cd frontend

# Instalar dependências
npm install

# Iniciar desenvolvimento
npm start
```

### 4. Credenciais Padrão
- **Super Admin**: `admin@unipass.com` / `admin123`
- **Dev Admin**: `dev@unipass.com` / `dev123`

---

## 🔧 Funcionalidades Implementadas

### ✅ Autenticação e Segurança
- [x] Registro e login de usuários
- [x] JWT com refresh tokens
- [x] Configuração segura (SECRET_KEY automática)
- [x] Hash seguro de senhas (bcrypt)
- [x] Middleware de autenticação

### ✅ Sistema de Check-in
- [x] Escaneamento de QR Code via câmera
- [x] Validação de proximidade física (GPS)
- [x] Check-in/checkout automático
- [x] Histórico de check-ins
- [x] Controle de ocupação das academias

### ✅ Gamificação Completa
- [x] Sistema de pontos por atividades
- [x] Níveis e progressão
- [x] Conquistas/achievements personalizadas
- [x] Leaderboard mensal/semanal
- [x] Streak de dias consecutivos
- [x] Histórico detalhado de pontos

### ✅ Gestão de Assinaturas
- [x] Múltiplos planos (Básico, Premium, Ilimitado)
- [x] Cobrança mensal e anual
- [x] Gestão de status de assinatura
- [x] Renovação automática
- [x] Cancelamento de assinaturas

### ✅ Painéis Administrativos
- [x] **Admin Panel**: Gestão completa do sistema
- [x] **Gym Dashboard**: Controle da academia
- [x] Estatísticas em tempo real
- [x] Gestão de usuários e academias
- [x] Relatórios de receita e crescimento

### ✅ PWA e Mobile
- [x] Instalação como app nativo
- [x] Funcionalidades offline
- [x] Push notifications
- [x] Haptic feedback
- [x] Design responsivo

### ✅ Localização e QR Codes
- [x] Geolocalização GPS
- [x] Cálculo de distância
- [x] Validação de proximidade (100m)
- [x] QR codes seguros com assinatura
- [x] Múltiplos formatos de QR code

---

## 👥 Tipos de Usuários

### 1. 🏃‍♂️ **Usuário Final**
**Permissões:**
- Check-in/checkout em academias
- Visualizar histórico de treinos
- Acompanhar pontos e conquistas
- Gerenciar assinatura
- Avaliar academias

**Telas Principais:**
- `/checkin` - Página de check-in
- `/profile` - Perfil do usuário
- `/gamification` - Pontos e conquistas
- `/plans` - Planos de assinatura

### 2. 🏢 **Administrador de Academia**
**Permissões:**
- Monitorar check-ins em tempo real
- Gerenciar ocupação da academia
- Forçar checkout de usuários
- Visualizar estatísticas da academia
- Gerar relatórios

**Telas Principais:**
- `/gym-dashboard` - Dashboard da academia

### 3. ⚙️ **Administrador do Sistema**
**Permissões:**
- Gestão completa de usuários
- Gestão de academias
- Visualizar estatísticas globais
- Configurações do sistema
- Relatórios financeiros

**Telas Principais:**
- `/admin` - Painel administrativo completo

### 4. 🛠️ **Super Administrador**
**Permissões:**
- Todas as permissões do sistema
- Gerenciar outros administradores
- Configurações avançadas
- Backup e manutenção

---

## 📖 Guias de Uso

### Para Usuários Finais

#### 🔐 **Primeiro Acesso**
1. Acesse a aplicação
2. Clique em "Registrar" 
3. Preencha seus dados
4. Confirme o email
5. Faça login

#### 📱 **Fazendo Check-in**
1. Vá para `/checkin`
2. Escolha "QR Code" ou "Buscar Academia"
3. **QR Code**: Escaneie o código na academia
4. **Busca**: Selecione a academia na lista
5. Confirme sua localização (GPS)
6. Check-in realizado! ✅

#### 🏆 **Sistema de Pontos**
- **Check-in**: +10 pontos
- **Avaliação**: +5 pontos  
- **Streak bonus**: +50% por dia consecutivo
- **Conquistas**: Pontos variados

### Para Administradores de Academia

#### 📊 **Monitoramento**
1. Acesse `/gym-dashboard`
2. Visualize check-ins ativos
3. Monitore ocupação em tempo real
4. Force checkout se necessário

#### 📈 **Relatórios**
- Ocupação por horário
- Frequência de usuários
- Receita mensal
- Crescimento de membros

### Para Administradores do Sistema

#### 👥 **Gestão de Usuários**
1. Acesse `/admin`
2. Aba "Usuários"
3. Buscar, filtrar, ativar/desativar
4. Visualizar detalhes completos

#### 🏢 **Gestão de Academias**
1. Aba "Academias"
2. Adicionar novas academias
3. Configurar ocupação máxima
4. Ativar/desativar academias

---

## 🔌 API Documentation

### Autenticação
```http
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
```

### Usuários
```http
GET    /api/users/me
PUT    /api/users/me
GET    /api/users/me/stats
GET    /api/users/me/checkins
```

### Academias
```http
GET    /api/gyms
GET    /api/gyms/search
GET    /api/gyms/{id}
POST   /api/gyms/{id}/favorite
```

### Check-ins
```http
POST   /api/checkins
PUT    /api/checkins/{id}/checkout
GET    /api/checkins/active
GET    /api/checkins/history
```

### Gamificação
```http
GET    /api/gamification/points
GET    /api/gamification/achievements
GET    /api/gamification/leaderboard
GET    /api/gamification/points/history
```

### Assinaturas
```http
GET    /api/subscriptions/plans
POST   /api/subscriptions
GET    /api/subscriptions/current
DELETE /api/subscriptions/{id}
```

### Administração
```http
GET    /api/admin/stats
GET    /api/admin/users
GET    /api/admin/gyms
PATCH  /api/admin/users/{id}/status
PATCH  /api/admin/gyms/{id}/status
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### `users` - Usuários
```sql
id, name, email, phone, password_hash, 
is_active, created_at, updated_at
```

#### `gyms` - Academias  
```sql
id, name, address, phone, latitude, longitude,
open_hours_weekdays, open_hours_weekends, amenities,
description, max_capacity, current_occupancy, 
rating, total_reviews, is_active, created_at
```

#### `checkins` - Check-ins
```sql
id, user_id, gym_id, checkin_time, checkout_time,
is_active, duration_minutes
```

#### `user_roles` - Roles de Usuários
```sql
id, user_id, role, permissions, gym_id, created_at
```

#### `subscriptions` - Assinaturas
```sql
id, user_id, plan_id, status, billing_cycle,
price_paid, start_date, end_date, auto_renew
```

#### `user_points` - Sistema de Pontos
```sql
id, user_id, total_points, level, current_streak,
longest_streak, last_checkin_date
```

#### `achievements` - Conquistas
```sql
id, name, description, icon, points_reward,
requirement_type, requirement_value
```

---

## 🚀 Deployment

### Ambiente de Produção

#### Backend
```bash
# Usar PostgreSQL ao invés de SQLite
DATABASE_URL=postgresql://user:pass@localhost/unipass

# Configurar variáveis de ambiente
SECRET_KEY=sua-chave-super-secreta
DEBUG=false
CORS_ORIGINS=https://seu-dominio.com

# Deploy com Docker
docker build -t unipass-backend .
docker run -p 8000:8000 unipass-backend
```

#### Frontend
```bash
# Build de produção
npm run build

# Deploy no Netlify/Vercel
netlify deploy --prod --dir=build
```

### Variáveis de Ambiente Críticas
```env
# Backend
SECRET_KEY=                    # Chave JWT (obrigatória)
DATABASE_URL=                  # URL do banco
CORS_ORIGINS=                  # Origens permitidas
PAYMENT_GATEWAY_SECRET=        # Chave do gateway de pagamento
FIREBASE_CONFIG_PATH=          # Configuração push notifications

# Frontend  
REACT_APP_API_URL=            # URL da API
REACT_APP_ENVIRONMENT=        # production/development
```

---

## 🔧 Troubleshooting

### Problemas Comuns

#### ❌ Erro: "BaseSettings has been moved"
**Solução:**
```bash
pip install pydantic-settings==2.2.1
```

#### ❌ Erro: QR Code não valida localização
**Verificar:**
1. Permissões de GPS ativadas
2. HTTPS habilitado (necessário para GPS)
3. Distância menor que 100m da academia

#### ❌ Erro: JWT token inválido
**Verificar:**
1. SECRET_KEY configurada
2. Token não expirado
3. Formato do token correto

#### ❌ PWA não instala
**Verificar:**
1. HTTPS ativo
2. Service Worker registrado
3. Manifest.json válido

### Logs e Debug

#### Backend
```bash
# Ativar logs detalhados
DEBUG=true python main.py

# Verificar banco de dados
python scripts/check_db.py
```

#### Frontend
```bash
# Build com source maps
npm run build

# Verificar service worker
chrome://serviceworker-internals/
```

---

## 📊 Métricas e Monitoramento

### KPIs Principais
- **DAU/MAU**: Usuários ativos diários/mensais
- **Retention Rate**: Taxa de retenção
- **Conversão**: Free → Paid subscriptions
- **Check-ins**: Frequência de uso
- **NPS**: Net Promoter Score

### Dashboards Disponíveis
- **Admin**: Visão geral do sistema
- **Gym**: Métricas por academia  
- **Financial**: Receita e assinaturas
- **User**: Engajamento e gamificação

---

## 🤝 Suporte e Contato

### Canais de Suporte
- **Email**: suporte@unipass.com
- **Discord**: [Link do servidor]
- **Documentação**: [docs.unipass.com]

### Desenvolvimento
- **GitHub**: [repositório]
- **CI/CD**: GitHub Actions
- **Monitoramento**: Sentry + Datadog

---

## 📈 Roadmap Futuro

### V2.0 - Próximas Features
- [ ] Integração com Apple Health / Google Fit
- [ ] Reserva de aulas e equipamentos
- [ ] Chat em tempo real
- [ ] Integração com wearables
- [ ] Marketplace de academias
- [ ] Sistema de referral
- [ ] Analytics avançadas
- [ ] API pública para parceiros

### Integrações Planejadas
- **Pagamentos**: Stripe, PagSeguro, Mercado Pago
- **Mapas**: Google Maps API
- **Push**: Firebase Cloud Messaging
- **Email**: SendGrid, Mailgun
- **Analytics**: Google Analytics, Mixpanel

---

*Documentação atualizada em: Dezembro 2024*  
*Versão do Sistema: 1.0.0*  
*Status: ✅ Produção Ready*
