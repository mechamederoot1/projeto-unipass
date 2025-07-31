#!/usr/bin/env python3
"""
Script para testar se todos os modelos carregam corretamente
"""

try:
    print("🧪 Testando importação dos modelos...")
    
    print("   ✅ Importando user...")
    import models.user
    
    print("   ✅ Importando admin...")
    import models.admin
    
    print("   ✅ Importando gym...")
    import models.gym
    
    print("   ✅ Importando checkin...")
    import models.checkin
    
    print("   ✅ Importando subscription...")
    import models.subscription
    
    print("   ✅ Importando gamification...")
    import models.gamification
    
    print("   ✅ Importando features...")
    import models.features
    
    print("   ✅ Importando audit...")
    import models.audit
    
    print("\n🎉 Todos os modelos carregados com sucesso!")
    print("✅ O erro 'metadata' foi corrigido!")
    
except Exception as e:
    print(f"\n❌ Erro ao importar modelos: {e}")
    import traceback
    traceback.print_exc()
