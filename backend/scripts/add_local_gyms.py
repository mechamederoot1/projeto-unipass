#!/usr/bin/env python3
"""
Script para adicionar academias próximas ao usuário em São Caetano do Sul e Mauá
"""
import sys
import os

# Adicionar o diretório backend ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def add_local_gyms():
    """Adiciona academias próximas ao usuário"""
    try:
        from sqlalchemy.orm import Session
        from database.connection import SessionLocal, engine, Base
        from models.gym import Gym
        
        print("🏢 Adicionando academias próximas...")
        print("=" * 50)
        
        # Conectar ao banco
        db: Session = SessionLocal()
        
        try:
            # Academias próximas ao usuário
            local_gyms = [
                {
                    "name": "Academia Espírito Santo",
                    "address": "Rua Espírito Santo, 315 - São Caetano do Sul - SP, 09530-700",
                    "phone": "(11) 4232-1000",
                    "latitude": -23.6181,  # São Caetano do Sul
                    "longitude": -46.5564,
                    "open_hours_weekdays": "05:30-23:00",
                    "open_hours_weekends": "06:00-20:00",
                    "amenities": "WiFi Grátis,Estacionamento,Chuveiros,Vestiário,Ar Condicionado",
                    "description": "Academia completa no coração de São Caetano do Sul",
                    "max_capacity": 120,
                    "current_occupancy": 35,
                    "is_active": True
                },
                {
                    "name": "Fitness Senhor do Bonfim",
                    "address": "Rua Senhor do Bonfim, 37 B - Jd São Sebastião, Mauá - SP, 09330-300",
                    "phone": "(11) 4512-2000",
                    "latitude": -23.6675,  # Mauá - Jd São Sebastião
                    "longitude": -46.4611,
                    "open_hours_weekdays": "06:00-22:00",
                    "open_hours_weekends": "07:00-19:00",
                    "amenities": "WiFi Grátis,Estacionamento,Chuveiros,Lanchonete",
                    "description": "Academia moderna no Jardim São Sebastião",
                    "max_capacity": 100,
                    "current_occupancy": 28,
                    "is_active": True
                },
                {
                    "name": "PowerGym Santo André",
                    "address": "Av. Industrial, 1500 - Santo André - SP, 09080-500",
                    "phone": "(11) 4436-3000",
                    "latitude": -23.6739,  # Santo André (próximo)
                    "longitude": -46.5391,
                    "open_hours_weekdays": "05:00-23:00",
                    "open_hours_weekends": "06:00-20:00",
                    "amenities": "WiFi Grátis,Estacionamento,Chuveiros,Café,Ar Condicionado,Musculação,Cardio",
                    "description": "Centro de treinamento completo em Santo André",
                    "max_capacity": 180,
                    "current_occupancy": 52,
                    "is_active": True
                },
                {
                    "name": "Fit Center ABC",
                    "address": "Rua das Figueiras, 280 - São Caetano do Sul - SP, 09520-400",
                    "phone": "(11) 4227-4000",
                    "latitude": -23.6089,  # São Caetano do Sul - centro
                    "longitude": -46.5477,
                    "open_hours_weekdays": "06:00-22:30",
                    "open_hours_weekends": "08:00-18:00",
                    "amenities": "WiFi Grátis,Estacionamento,Chuveiros,Vestiário,Spinning",
                    "description": "Academia familiar no centro de São Caetano",
                    "max_capacity": 90,
                    "current_occupancy": 31,
                    "is_active": True
                }
            ]
            
            gyms_added = 0
            
            for gym_data in local_gyms:
                # Verificar se academia já existe
                existing = db.query(Gym).filter(Gym.name == gym_data["name"]).first()
                if existing:
                    print(f"⏭️  Academia '{gym_data['name']}' já existe")
                    continue
                
                gym = Gym(**gym_data)
                db.add(gym)
                gyms_added += 1
                print(f"✅ Adicionada: {gym_data['name']}")
                print(f"   📍 {gym_data['address']}")
                print(f"   🗺️  Coordenadas: {gym_data['latitude']}, {gym_data['longitude']}")
            
            if gyms_added > 0:
                db.commit()
                print(f"\n🎉 {gyms_added} academias adicionadas com sucesso!")
            else:
                print("\nℹ️  Todas as academias já existem no sistema")
            
            # Mostrar academias próximas
            print("\n📍 Academias disponíveis na região:")
            all_local_gyms = db.query(Gym).filter(
                Gym.latitude.between(-23.7, -23.6),
                Gym.longitude.between(-46.6, -46.4)
            ).all()
            
            for gym in all_local_gyms:
                status = "🟢 Aberta" if gym.current_occupancy < gym.max_capacity * 0.8 else "🟡 Ocupada"
                print(f"   🏢 {gym.name}")
                print(f"      📍 {gym.address}")
                print(f"      👥 {gym.current_occupancy}/{gym.max_capacity} {status}")
                print()
            
            print("=" * 50)
            print("✅ Agora você pode fazer check-in nas academias próximas!")
            print("🔄 Atualize a página de check-in para ver as novas opções")
            
        except Exception as e:
            print(f"❌ Erro ao adicionar academias: {e}")
            db.rollback()
            raise
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Erro crítico: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

def show_distance_info():
    """Mostra informações sobre distâncias e QR codes"""
    print("\n📱 COMO USAR:")
    print("=" * 30)
    print("1. 📍 Se você estiver próximo (até 100m) de uma academia:")
    print("   - Use o QR Code scanner da academia")
    print("   - Ou selecione a academia na lista")
    print()
    print("2. 🧪 Para testes (QR Codes de exemplo):")
    print("   - Use os QR codes de teste disponíveis na página")
    print("   - Funcionam mesmo à distância para demonstração")
    print()
    print("3. 🗺️  Coordenadas das academias adicionadas:")
    print("   - Academia Espírito Santo: -23.6181, -46.5564")
    print("   - Fitness Senhor do Bonfim: -23.6675, -46.4611")
    print("   - PowerGym Santo André: -23.6739, -46.5391")
    print("   - Fit Center ABC: -23.6089, -46.5477")

if __name__ == "__main__":
    print("🏢 Adicionando Academias Locais - São Caetano do Sul e Mauá")
    print("Endereços solicitados:")
    print("- Rua Esp��rito Santo, 315 - São Caetano do Sul")
    print("- Rua Senhor do Bonfim, 37 B - Mauá")
    print()
    
    success = add_local_gyms()
    
    if success:
        show_distance_info()
        print("\n✅ Academias adicionadas! Execute 'python main.py' se o backend não estiver rodando.")
    else:
        print("\n❌ Falha ao adicionar academias.")
        sys.exit(1)
