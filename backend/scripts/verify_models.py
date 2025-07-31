#!/usr/bin/env python3
"""
Script para verificar se os modelos estão definidos corretamente
"""
import sys
import os

# Adicionar o diretório backend ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    print("🔍 Verificando modelos...")
    
    # Test imports
    from models.user import User
    from models.admin import AdminUser, UserRole
    from models.gym import Gym
    
    print("✅ Imports OK")
    
    # Test enum values
    print(f"📋 UserRole values: {[role.value for role in UserRole]}")
    
    # Test model creation (without saving)
    print("🧪 Testando criação de objetos...")
    
    # Test User
    test_user = User(
        name="Test User",
        email="test@test.com",
        phone="123456789",
        password_hash="test_hash",
        is_active=True
    )
    print("   ✅ User model OK")
    
    # Test AdminUser  
    test_admin = AdminUser(
        user_id=1,
        role=UserRole.SUPER_ADMIN,
        permissions='["all"]',
        is_active=True
    )
    print("   ✅ AdminUser model OK")
    
    # Test Gym
    test_gym = Gym(
        name="Test Gym",
        address="Test Address",
        phone="123456789",
        latitude=-23.5505,
        longitude=-46.6333,
        open_hours_weekdays="06:00-22:00",
        open_hours_weekends="08:00-18:00",
        max_capacity=100
    )
    print("   ✅ Gym model OK")
    
    print("\n🎉 Todos os modelos estão funcionando corretamente!")
    print("Agora você pode executar: python scripts/create_admin_simple.py")
    
except Exception as e:
    print(f"\n❌ Erro: {e}")
    import traceback
    traceback.print_exc()
