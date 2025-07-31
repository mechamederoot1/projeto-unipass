#!/usr/bin/env python3
"""
Script para gerar QR codes das academias locais para teste
"""
import sys
import os
import json

# Adicionar o diretório backend ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def generate_qr_codes():
    """Gera QR codes para as academias locais"""
    try:
        from sqlalchemy.orm import Session
        from database.connection import SessionLocal
        from models.gym import Gym
        
        print("📱 Gerando QR codes para academias locais...")
        
        db: Session = SessionLocal()
        
        try:
            # Buscar academias da região ABC
            local_gyms = db.query(Gym).filter(
                Gym.latitude.between(-23.7, -23.6),
                Gym.longitude.between(-46.6, -46.4)
            ).all()
            
            qr_codes = {}
            
            for gym in local_gyms:
                # Formato de QR code para o sistema
                qr_data = {
                    "type": "gym_checkin",
                    "gymId": gym.id,
                    "gymName": gym.name,
                    "coordinates": {
                        "latitude": gym.latitude,
                        "longitude": gym.longitude
                    },
                    "validUntil": "2024-12-31T23:59:59Z",  # Válido até final do ano
                    "signature": f"qr_{gym.id}_{gym.name[:4]}_2024"
                }
                
                qr_codes[gym.name] = json.dumps(qr_data)
                
                print(f"✅ QR gerado para: {gym.name}")
                print(f"   ID: {gym.id}")
                print(f"   Coordenadas: {gym.latitude}, {gym.longitude}")
                print()
            
            # Salvar QR codes em arquivo para fácil acesso
            with open('local_qr_codes.json', 'w', encoding='utf-8') as f:
                json.dump(qr_codes, f, indent=2, ensure_ascii=False)
            
            print(f"📄 QR codes salvos em: local_qr_codes.json")
            print(f"🎯 Total de academias: {len(qr_codes)}")
            
            print("\n" + "="*60)
            print("📱 QR CODES PARA TESTE:")
            print("="*60)
            
            for gym_name, qr_code in qr_codes.items():
                print(f"\n🏢 {gym_name}:")
                print(f"QR Code: {qr_code[:100]}...")
                print("-" * 40)
            
            return qr_codes
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()
        return None

def update_frontend_qr_codes():
    """Instrução para atualizar os QR codes no frontend"""
    print("\n🔧 PARA ATUALIZAR OS QR CODES NO FRONTEND:")
    print("="*50)
    print("1. Os QR codes de teste são gerados automaticamente")
    print("2. No arquivo frontend/src/services/qrcode.ts")
    print("3. Método generateSampleQRCodes() já inclui as academias")
    print("4. Atualize a página de check-in para ver as novas opções")
    print()
    print("🧪 COMO TESTAR:")
    print("- Acesse /checkin")
    print("- Clique em 'QR Code'")
    print("- Use os QR codes de teste listados")
    print("- Ou use o scanner real se estiver próximo à academia")

if __name__ == "__main__":
    print("📱 Gerador de QR Codes - Academias Locais")
    print("São Caetano do Sul e Mauá")
    print()
    
    qr_codes = generate_qr_codes()
    
    if qr_codes:
        update_frontend_qr_codes()
        print("\n✅ QR codes gerados com sucesso!")
    else:
        print("\n❌ Falha ao gerar QR codes.")
