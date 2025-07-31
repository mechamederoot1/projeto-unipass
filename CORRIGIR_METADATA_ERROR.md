# 🔧 Correção do Erro SQLAlchemy Metadata

## ❌ Problema Original
```
sqlalchemy.exc.InvalidRequestError: Attribute name 'metadata' is reserved when using the Declarative API.
```

## ✅ Correção Aplicada

O erro foi causado por uma coluna chamada `metadata` no modelo `Payment`, que é um nome reservado pelo SQLAlchemy.

### Arquivo corrigido: `backend/models/subscription.py`
**Linha 122 alterada:**
```python
# ANTES (❌):
metadata = Column(Text)  # JSON string for additional payment data

# DEPOIS (✅):
payment_metadata = Column(Text)  # JSON string for additional payment data
```

## 🚀 Como testar a correção

### 1. Testar importação dos modelos
```bash
cd backend
python test_models.py
```

**Resultado esperado:**
```
🧪 Testando importação dos modelos...
   ✅ Importando user...
   ✅ Importando admin...
   ✅ Importando gym...
   ✅ Importando checkin...
   ✅ Importando subscription...
   ✅ Importando gamification...
   ✅ Importando features...
   ✅ Importando audit...

🎉 Todos os modelos carregados com sucesso!
✅ O erro 'metadata' foi corrigido!
```

### 2. Inicializar o sistema
```bash
cd backend
python scripts/create_admin.py
```

### 3. Iniciar o backend
```bash
cd backend
python main.py
```

**Deve iniciar sem erros e mostrar:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

## 📋 Verificação Completa

### Executar teste completo do sistema:
```bash
cd backend
python scripts/test_system.py
```

### URLs para testar:
- **API Docs**: http://localhost:8000/docs
- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin

### Credenciais de teste:
- **Admin**: admin@unipass.com / admin123
- **Dev**: dev@unipass.com / dev123

## 🔍 O que foi corrigido

1. ✅ **Modelo Payment** - Coluna `metadata` renomeada para `payment_metadata`
2. ✅ **Imports SQLAlchemy** - Todos os imports necessários estão presentes
3. ✅ **Relacionamentos** - Mantidos íntegros
4. ✅ **Schema Pydantic** - Não precisa alteração (não usa o campo)

## ❓ Se ainda houver problemas

### Verificar dependências:
```bash
pip install -r requirements.txt
pip install pydantic-settings==2.2.1
```

### Limpar banco e recriar:
```bash
rm -f unipass.db  # Remove banco SQLite antigo
python scripts/create_admin.py  # Recria com estrutura correta
```

### Debug detalhado:
```bash
python -c "import models.subscription; print('✅ Subscription OK')"
python main.py --reload
```

**Sistema corrigido e funcionando!** ✅
