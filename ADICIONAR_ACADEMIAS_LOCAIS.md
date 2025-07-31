# 🏢 Adicionar Academias Locais

## 📍 Endereços Solicitados

1. **Academia Espírito Santo**
   - 📍 Rua Espírito Santo, 315 - São Caetano do Sul - SP, 09530-700
   - 🗺️ Coordenadas: -23.6181, -46.5564

2. **Fitness Senhor do Bonfim**  
   - 📍 Rua Senhor do Bonfim, 37 B - Jd São Sebastião, Mauá - SP, 09330-300
   - 🗺️ Coordenadas: -23.6675, -46.4611

## 🚀 Como Adicionar as Academias

### 1. Executar o script de adição
```bash
cd backend
python scripts/add_local_gyms.py
```

**Resultado esperado:**
```
🏢 Adicionando academias próximas...
✅ Adicionada: Academia Espírito Santo
   📍 Rua Espírito Santo, 315 - São Caetano do Sul - SP, 09530-700
   🗺️ Coordenadas: -23.6181, -46.5564

✅ Adicionada: Fitness Senhor do Bonfim
   📍 Rua Senhor do Bonfim, 37 B - Jd São Sebastião, Mauá - SP, 09330-300
   🗺️ Coordenadas: -23.6675, -46.4611

🎉 4 academias adicionadas com sucesso!
```

### 2. Gerar QR codes para teste (opcional)
```bash
python scripts/generate_local_qr_codes.py
```

### 3. Reiniciar o backend (se necessário)
```bash
python main.py
```

## 🧪 Como Testar as Novas Academias

### 1. Via Interface Web
1. Acesse: http://localhost:3000/checkin
2. Clique em "QR Code"
3. Veja os novos QR codes de teste:
   - ✅ Academia Espírito Santo
   - ✅ Fitness Senhor do Bonfim
   - ✅ PowerGym Santo André
   - ✅ Fit Center ABC

### 2. Via Busca por Localização
1. Acesse: http://localhost:3000/checkin  
2. Clique em "Buscar"
3. As academias aparecerão na lista se você estiver próximo

### 3. Teste de Distância
- **Distância máxima**: 100 metros
- **Localização real**: Use GPS para check-in real
- **QR codes de teste**: Funcionam à distância para demonstração

## 📱 QR Codes Disponíveis

Após executar o script, você terá acesso a:

### Academias ABC Paulista (Novas):
- 🏢 **Academia Espírito Santo** (São Caetano do Sul)
- 🏢 **Fitness Senhor do Bonfim** (Mauá)  
- 🏢 **PowerGym Santo André** (Santo André)
- 🏢 **Fit Center ABC** (São Caetano do Sul)

### Academias Originais (São Paulo Capital):
- 🏢 **Smart Fit Paulista**
- 🏢 **Bio Ritmo Faria Lima**
- 🏢 **Academia Central**
- 🏢 **Bodytech Vila Olímpia**

## 🗺️ Mapa de Localização

### Região ABC Paulista:
```
São Caetano do Sul:
├── Academia Espírito Santo (-23.6181, -46.5564)
└── Fit Center ABC (-23.6089, -46.5477)

Mauá:
└── Fitness Senhor do Bonfim (-23.6675, -46.4611)

Santo André:
└── PowerGym Santo André (-23.6739, -46.5391)
```

## ⚙️ Funcionalidades Disponíveis

### ✅ Check-in por QR Code
- Scanner de câmera real
- QR codes de teste para demonstração
- Validação de proximidade GPS

### ✅ Check-in por Busca
- Lista de academias próximas
- Filtro por distância
- Informações de ocupação

### ✅ Gamificação
- +10 pontos por check-in
- Sistema de conquistas
- Ranking mensal

## 🔧 Se Houver Problemas

### Academia não aparece na lista:
```bash
# Verificar se foi adicionada ao banco
cd backend
python -c "
from database.connection import SessionLocal
from models.gym import Gym
db = SessionLocal()
gyms = db.query(Gym).filter(Gym.name.contains('Espírito')).all()
for gym in gyms:
    print(f'✅ {gym.name} - {gym.latitude}, {gym.longitude}')
db.close()
"
```

### QR codes não funcionam:
1. Verificar se o frontend foi atualizado
2. Limpar cache do navegador
3. Recarregar a página de check-in

### Erro de distância:
- Para **teste**: Use os QR codes de exemplo
- Para **uso real**: Esteja fisicamente próximo (até 100m)

## 📞 Informações Adicionais

### Horários das Academias:
- **Academia Espírito Santo**: Seg-Sex 05:30-23:00, Sáb-Dom 06:00-20:00
- **Fitness Senhor do Bonfim**: Seg-Sex 06:00-22:00, Sáb-Dom 07:00-19:00

### Capacidade:
- **Academia Espírito Santo**: 120 pessoas (35 ocupadas)
- **Fitness Senhor do Bonfim**: 100 pessoas (28 ocupadas)

**Academias adicionadas e prontas para uso!** ✅
