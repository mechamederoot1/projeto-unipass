# 🔧 Correção do Erro UserRole

## ❌ Problemas Corrigidos

1. **TypeError**: `EnumType.__call__() got an unexpected keyword argument 'user_id'`
2. **DeprecationWarning**: `datetime.datetime.utcnow() is deprecated`

## ✅ O que foi corrigido

### 1. Problema Principal - UserRole vs AdminUser
**Causa**: O script estava tentando criar uma instância do enum `UserRole` ao invés do modelo `AdminUser`

**Correção aplicada:**
```python
# ❌ ANTES (ERRO):
from models.admin import UserRole
admin_role = UserRole(user_id=..., role="super_admin", ...)

# ✅ DEPOIS (CORRETO):
from models.admin import AdminUser, UserRole
admin_role = AdminUser(user_id=..., role=UserRole.SUPER_ADMIN, ...)
```

### 2. Problema Secondary - DateTime Deprecated
**Correção aplicada:**
```python
# ❌ ANTES:
from datetime import datetime
created_at=datetime.utcnow()

# ✅ DEPOIS:
from datetime import datetime, timezone
created_at=datetime.now(timezone.utc)
```

## 🚀 Como testar agora

### 1. Verificar se os modelos estão OK
```bash
cd backend
python scripts/verify_models.py
```

**Resultado esperado:**
```
🔍 Verificando modelos...
✅ Imports OK
📋 UserRole values: ['user', 'gym_admin', 'super_admin']
🧪 Testando criação de objetos...
   ✅ User model OK
   ✅ AdminUser model OK
   ✅ Gym model OK

🎉 Todos os modelos estão funcionando corretamente!
```

### 2. Executar a inicialização
```bash
python scripts/create_admin_simple.py
```

**Resultado esperado:**
```
🚀 Inicializando sistema Unipass...
📋 Criando estrutura do banco de dados...
   ✅ Tabelas criadas com sucesso!
👤 Criando usuário administrador...
✅ Administrador criado com sucesso!
📧 Email: admin@unipass.com
🔐 Senha: admin123

👤 Criando usuário desenvolvedor...
✅ Desenvolvedor criado com sucesso!
📧 Email: dev@unipass.com
🔐 Senha: dev123

🏢 Criando academias de exemplo...
✅ 3 academias criadas!

🎉 Inicialização concluída com sucesso!
```

### 3. Iniciar o backend
```bash
python main.py
```

### 4. Testar o sistema completo
```bash
python scripts/test_system.py
```

## 🔑 Credenciais Criadas

### Usuários:
- **Super Admin**: admin@unipass.com / admin123
  - Role: `SUPER_ADMIN`
  - Permissions: `["all"]`

- **Gym Admin**: dev@unipass.com / dev123
  - Role: `GYM_ADMIN` 
  - Permissions: `["user_management", "gym_management", "reports"]`

### Academias:
1. **Smart Fit Paulista** (Lat: -23.5505, Lng: -46.6333)
2. **Bio Ritmo Faria Lima** (Lat: -23.5729, Lng: -46.6899)  
3. **Academia Central** (Lat: -23.5489, Lng: -46.6388)

## 🌐 URLs de Acesso

- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin (usar admin@unipass.com)
- **API Docs**: http://localhost:8000/docs
- **Backend Health**: http://localhost:8000/

## 🔧 Estrutura Correta dos Modelos

### UserRole (Enum)
```python
class UserRole(enum.Enum):
    USER = "user"
    GYM_ADMIN = "gym_admin"
    SUPER_ADMIN = "super_admin"
```

### AdminUser (Modelo SQLAlchemy)
```python
class AdminUser(Base):
    __tablename__ = "admin_users"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    permissions = Column(String(500))  # JSON string
    is_active = Column(Boolean, default=True)
```

## ❓ Se ainda houver problemas

### Debug passo a passo:
```bash
# 1. Verificar modelos
python scripts/verify_models.py

# 2. Limpar banco antigo
rm -f unipass.db

# 3. Recriar sistema
python scripts/create_admin_simple.py

# 4. Verificar tabelas criadas
python -c "from database.connection import engine; print(engine.table_names())"
```

**Sistema corrigido e pronto para uso!** ✅
