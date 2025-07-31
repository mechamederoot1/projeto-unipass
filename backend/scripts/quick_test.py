#!/usr/bin/env python3
"""
Script simplificado para testar inicialização do sistema
"""
import sys
import os

# Adicionar o diretório backend ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    print("🧪 Testando imports básicos...")
    
    # Test database connection
    from database.connection import SessionLocal, engine, Base
    print("   ✅ Database connection OK")
    
    # Test user model
    from models.user import User
    print("   ✅ User model OK")
    
    # Test admin model
    from models.admin import UserRole
    print("   ✅ Admin model OK")
    
    # Test gym model
    from models.gym import Gym
    print("   ✅ Gym model OK")
    
    # Test auth utils
    from utils.auth import get_password_hash
    print("   ✅ Auth utils OK")
    
    print("\n🎉 Todos os imports funcionando!")
    
    # Create database tables
    print("\n📋 Criando tabelas do banco...")
    Base.metadata.create_all(bind=engine)
    print("   ✅ Tabelas criadas com sucesso!")
    
    # Test database session
    db = SessionLocal()
    try:
        # Check if tables exist
        user_count = db.query(User).count()
        gym_count = db.query(Gym).count()
        print(f"   📊 Usuários no banco: {user_count}")
        print(f"   📊 Academias no banco: {gym_count}")
        
    finally:
        db.close()
    
    print("\n✅ Sistema básico funcionando corretamente!")
    print("Agora você pode executar: python scripts/create_admin.py")
    
except Exception as e:
    print(f"\n❌ Erro: {e}")
    import traceback
    traceback.print_exc()
