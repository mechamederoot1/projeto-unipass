#!/usr/bin/env python3
"""
Script de teste para verificar se o sistema Unipass está funcionando corretamente
"""
import sys
import os
import requests
import json
from datetime import datetime

# Adicionar o diretório backend ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

API_BASE = "http://localhost:8000/api"

def test_api_health():
    """Testa se a API está respondendo"""
    try:
        response = requests.get("http://localhost:8000/")
        return response.status_code == 200
    except:
        return False

def test_login(email, password):
    """Testa login de usuário"""
    try:
        response = requests.post(f"{API_BASE}/auth/login", data={
            "username": email,
            "password": password
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    except:
        return None

def test_authenticated_endpoint(token):
    """Testa endpoint autenticado"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_BASE}/users/me", headers=headers)
        return response.status_code == 200
    except:
        return False

def test_gyms_endpoint():
    """Testa endpoint de academias"""
    try:
        response = requests.get(f"{API_BASE}/gyms")
        return response.status_code == 200 and len(response.json()) > 0
    except:
        return False

def run_system_tests():
    """Executa todos os testes do sistema"""
    print("🧪 Iniciando testes do sistema Unipass...")
    print("=" * 60)
    
    tests_passed = 0
    total_tests = 5
    
    # Teste 1: API Health
    print("1️⃣  Testando saúde da API...")
    if test_api_health():
        print("   ✅ API está respondendo")
        tests_passed += 1
    else:
        print("   ❌ API não está respondendo - Verifique se o backend está rodando")
    
    # Teste 2: Login Admin
    print("\n2️⃣  Testando login do administrador...")
    admin_token = test_login("admin@unipass.com", "admin123")
    if admin_token:
        print("   ✅ Login do admin funcionando")
        tests_passed += 1
    else:
        print("   ❌ Falha no login do admin - Execute create_admin.py")
    
    # Teste 3: Login Dev
    print("\n3️⃣  Testando login do desenvolvedor...")
    dev_token = test_login("dev@unipass.com", "dev123")
    if dev_token:
        print("   ✅ Login do dev funcionando")
        tests_passed += 1
    else:
        print("   ❌ Falha no login do dev - Execute create_admin.py")
    
    # Teste 4: Endpoint Autenticado
    print("\n4️⃣  Testando endpoints autenticados...")
    if admin_token and test_authenticated_endpoint(admin_token):
        print("   ✅ Autenticação JWT funcionando")
        tests_passed += 1
    else:
        print("   ❌ Falha na autenticação JWT")
    
    # Teste 5: Academias
    print("\n5️⃣  Testando endpoint de academias...")
    if test_gyms_endpoint():
        print("   ✅ Academias carregadas com sucesso")
        tests_passed += 1
    else:
        print("   ❌ Nenhuma academia encontrada - Execute create_admin.py")
    
    # Resultado Final
    print("\n" + "=" * 60)
    print(f"📊 Resultado: {tests_passed}/{total_tests} testes passaram")
    
    if tests_passed == total_tests:
        print("🎉 SISTEMA FUNCIONANDO PERFEITAMENTE!")
        print("\n✅ Credenciais de acesso:")
        print("   👤 Admin: admin@unipass.com / admin123")
        print("   👤 Dev: dev@unipass.com / dev123")
        print("\n🌐 URLs importantes:")
        print("   📱 Frontend: http://localhost:3000")
        print("   🔧 Admin Panel: http://localhost:3000/admin")
        print("   📊 Gym Dashboard: http://localhost:3000/gym-dashboard") 
        print("   📋 API Docs: http://localhost:8000/docs")
    elif tests_passed >= 3:
        print("⚠️  Sistema funcionando com alguns problemas")
        print("   Consulte a documentação para resolver as falhas")
    else:
        print("❌ Sistema com problemas graves")
        print("   Verifique se o backend está rodando corretamente")
        print("   Execute: python scripts/create_admin.py")
    
    return tests_passed == total_tests

def check_frontend():
    """Verifica se o frontend está rodando"""
    try:
        response = requests.get("http://localhost:3000")
        return response.status_code == 200
    except:
        return False

def full_system_check():
    """Verificação completa do sistema"""
    print("🔍 Verificação completa do sistema...")
    print("=" * 60)
    
    # Backend
    backend_ok = test_api_health()
    print(f"🔧 Backend (Port 8000): {'✅ OK' if backend_ok else '❌ Offline'}")
    
    # Frontend  
    frontend_ok = check_frontend()
    print(f"📱 Frontend (Port 3000): {'✅ OK' if frontend_ok else '❌ Offline'}")
    
    if backend_ok and frontend_ok:
        print("\n🎉 Sistema completo funcionando!")
        return True
    else:
        print("\n⚠️  Problemas detectados:")
        if not backend_ok:
            print("   - Iniciar backend: cd backend && python main.py")
        if not frontend_ok:
            print("   - Iniciar frontend: cd frontend && npm start")
        return False

if __name__ == "__main__":
    print("🚀 Unipass System Tester")
    print("Versão: 1.0.0")
    print("Data:", datetime.now().strftime("%d/%m/%Y %H:%M:%S"))
    print("\n")
    
    # Verificação básica primeiro
    if full_system_check():
        print("\n" + "=" * 60)
        # Se básico está OK, executar testes completos
        run_system_tests()
    else:
        print("\n❌ Sistema não está completamente rodando")
        print("Inicie o backend e frontend antes de executar os testes")
