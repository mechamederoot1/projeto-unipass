# 🚀 Instalação Rápida - Unipass

## ⚡ Setup em 5 Minutos

### 1. Corrigir Dependências do Backend
```bash
cd backend
pip install pydantic-settings==2.2.1
```

### 2. Inicializar Sistema
```bash
# Criar admin e dados de exemplo
python scripts/create_admin.py

# Iniciar backend
python main.py
```

### 3. Iniciar Frontend
```bash
cd frontend
npm start
```

## 🔑 Credenciais de Teste

### Administrador Principal
- **Email:** `admin@unipass.com`
- **Senha:** `admin123`
- **Acesso:** Painel completo em `/admin`

### Desenvolvedor
- **Email:** `dev@unipass.com`  
- **Senha:** `dev123`
- **Acesso:** Funções administrativas

## 🏢 Academias de Teste

O sistema vem com 3 academias pré-configuradas:

1. **Smart Fit Paulista** (ID: 1)
   - Av. Paulista, 1000
   - Coordenadas: -23.5505, -46.6333

2. **Bio Ritmo Faria Lima** (ID: 2)
   - Av. Faria Lima, 2000  
   - Coordenadas: -23.5729, -46.6899

3. **Academia Central** (ID: 3)
   - R. Augusta, 500
   - Coordenadas: -23.5489, -46.6388

## 🧪 Testando Funcionalidades

### 1. Check-in via QR Code
- Acesse `/checkin`
- Clique em "QR Code" 
- Use os QR codes de teste gerados automaticamente

### 2. Gamificação
- Acesse `/gamification`
- Faça alguns check-ins para ganhar pontos
- Veja conquistas e ranking

### 3. Painel Admin
- Login como admin
- Acesse `/admin`
- Gerencie usuários e academias

### 4. Dashboard da Academia
- Acesse `/gym-dashboard`
- Monitore check-ins ativos
- Controle ocupação

## 🔧 Problemas Comuns

### Backend não inicia
```bash
# Verificar se todas as dependências estão instaladas
pip install -r requirements.txt
pip install pydantic-settings==2.2.1

# Verificar se o banco foi inicializado
python scripts/create_admin.py
```

### Frontend com erros
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
npm start
```

### QR Code não funciona
- Usar HTTPS (necessário para câmera)
- Permitir acesso à localização
- Estar próximo das coordenadas das academias de teste

## 📱 PWA (Progressive Web App)

### Instalar como App
1. Abrir no Chrome/Safari
2. Clicar no ícone de instalação
3. Confirmar instalação
4. Usar como app nativo

### Features PWA Ativas
- ✅ Instalação nativa
- ✅ Funcionamento offline
- ✅ Push notifications  
- ✅ Ícones na home screen
- ✅ Splash screen personalizada

## 🌐 URLs Importantes

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Docs da API:** http://localhost:8000/docs
- **Admin Panel:** http://localhost:3000/admin
- **Gym Dashboard:** http://localhost:3000/gym-dashboard

## 🎯 Próximos Passos

1. **Testar todas as funcionalidades** com as credenciais fornecidas
2. **Personalizar academias** com suas coordenadas reais
3. **Configurar gateway de pagamento** para assinaturas
4. **Setup push notifications** com Firebase
5. **Deploy em produção** seguindo a documentação completa

## 📞 Suporte

Se encontrar problemas:
1. Verificar os logs no terminal
2. Consultar `DOCUMENTACAO_UNIPASS.md`
3. Verificar as configurações no `.env`

**Sistema testado e funcionando em:** Windows, macOS, Linux  
**Navegadores compatíveis:** Chrome, Firefox, Safari, Edge
