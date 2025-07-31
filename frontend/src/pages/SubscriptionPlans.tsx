import React, { useState, useEffect } from 'react';
import { Check, Star, Zap, Shield, Crown, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiService } from '../services/api';

interface Plan {
  id: number;
  name: string;
  description: string;
  plan_type: 'basic' | 'premium' | 'unlimited';
  price_monthly: number;
  price_yearly: number;
  features: string[];
  max_checkins_per_month?: number;
  is_active: boolean;
}

interface CurrentSubscription {
  id: number;
  plan_name: string;
  plan_type: string;
  status: string;
  billing_cycle: string;
  price_paid: number;
  end_date: string;
  auto_renew: boolean;
}

const SubscriptionPlans: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadPlansAndSubscription();
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPlansAndSubscription = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadPlans(),
        loadCurrentSubscription()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const plansData = await apiService.getSubscriptionPlans();
      setPlans(plansData);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      // Fallback para planos básicos
      setPlans([
        {
          id: 1,
          name: 'Básico',
          description: 'Perfeito para começar sua jornada fitness',
          plan_type: 'basic',
          price_monthly: 29.90,
          price_yearly: 299.00,
          features: ['10 check-ins por mês', 'Acesso básico ao app', 'Suporte por email'],
          max_checkins_per_month: 10,
          is_active: true
        },
        {
          id: 2,
          name: 'Premium',
          description: 'Para quem treina com mais frequência',
          plan_type: 'premium',
          price_monthly: 49.90,
          price_yearly: 499.00,
          features: ['30 check-ins por mês', 'Gamificação completa', 'Análises avançadas', 'Suporte prioritário'],
          max_checkins_per_month: 30,
          is_active: true
        },
        {
          id: 3,
          name: 'Ilimitado',
          description: 'Liberdade total para treinar',
          plan_type: 'unlimited',
          price_monthly: 79.90,
          price_yearly: 799.00,
          features: ['Check-ins ilimitados', 'Todos os recursos premium', 'Suporte 24/7', 'Acesso antecipado a novidades'],
          max_checkins_per_month: undefined,
          is_active: true
        }
      ]);
    }
  };

  const loadCurrentSubscription = async () => {
    try {
      const subscription = await apiService.getCurrentSubscription();
      setCurrentSubscription(subscription);
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error);
      setCurrentSubscription(null);
    }
  };

  const handleSubscribe = async (planId: number) => {
    if (!isAuthenticated) {
      alert('Faça login para assinar um plano');
      return;
    }

    setIsProcessing(planId);
    try {
      await apiService.createSubscription(planId, selectedBilling);
      alert('Assinatura criada com sucesso!');
      await loadCurrentSubscription();
    } catch (error) {
      console.error('Erro ao criar assinatura:', error);
      alert('Erro ao processar assinatura. Tente novamente.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;

    if (window.confirm('Tem certeza que deseja cancelar sua assinatura?')) {
      try {
        await apiService.cancelSubscription(currentSubscription.id);
        alert('Assinatura cancelada com sucesso!');
        await loadCurrentSubscription();
      } catch (error) {
        console.error('Erro ao cancelar assinatura:', error);
        alert('Erro ao cancelar assinatura. Tente novamente.');
      }
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'basic':
        return <Shield className="h-8 w-8" />;
      case 'premium':
        return <Star className="h-8 w-8" />;
      case 'unlimited':
        return <Crown className="h-8 w-8" />;
      default:
        return <Zap className="h-8 w-8" />;
    }
  };

  const getPrice = (plan: Plan) => {
    return selectedBilling === 'monthly' ? plan.price_monthly : plan.price_yearly;
  };

  const getSavings = (plan: Plan) => {
    const monthlyCost = plan.price_monthly * 12;
    const yearlyCost = plan.price_yearly;
    return monthlyCost - yearlyCost;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Restrito</h2>
          <p className="text-gray-600">Faça login para ver os planos disponíveis</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Escolha seu Plano
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Encontre o plano perfeito para suas necessidades de treino
          </p>
        </div>

        {/* Current Subscription Alert */}
        {currentSubscription && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  Assinatura Ativa: {currentSubscription.plan_name}
                </h3>
                <p className="text-blue-700">
                  Status: {currentSubscription.status} • 
                  Renovação: {new Date(currentSubscription.end_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <button
                onClick={handleCancelSubscription}
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Cancelar Assinatura
              </button>
            </div>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            <button
              onClick={() => setSelectedBilling('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedBilling === 'monthly'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setSelectedBilling('yearly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedBilling === 'yearly'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Anual
              <span className="ml-2 text-green-600 text-xs font-bold">ECONOMIZE</span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                plan.plan_type === 'premium'
                  ? 'border-primary-500 scale-105'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              {plan.plan_type === 'premium' && (
                <div className="bg-primary-500 text-white text-center py-2 rounded-t-2xl">
                  <span className="font-semibold text-sm">MAIS POPULAR</span>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                    plan.plan_type === 'basic' ? 'bg-blue-100 text-blue-600' :
                    plan.plan_type === 'premium' ? 'bg-primary-100 text-primary-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {getPlanIcon(plan.plan_type)}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                {/* Pricing */}
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">
                      R$ {getPrice(plan).toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-gray-500 ml-2">
                      /{selectedBilling === 'monthly' ? 'mês' : 'ano'}
                    </span>
                  </div>
                  {selectedBilling === 'yearly' && (
                    <p className="text-green-600 text-sm mt-2">
                      Economize R$ {getSavings(plan).toFixed(2).replace('.', ',')} por ano
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isProcessing === plan.id || currentSubscription?.plan_type === plan.plan_type}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                    currentSubscription?.plan_type === plan.plan_type
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : plan.plan_type === 'premium'
                      ? 'bg-primary-600 hover:bg-primary-700 text-white'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                >
                  {isProcessing === plan.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processando...
                    </div>
                  ) : currentSubscription?.plan_type === plan.plan_type ? (
                    'Plano Atual'
                  ) : (
                    <>
                      <CreditCard className="inline h-5 w-5 mr-2" />
                      Assinar Agora
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Todos os planos incluem garantia de 7 dias ou seu dinheiro de volta
          </p>
          <p className="text-sm text-gray-500">
            Perguntas? Entre em contato conosco pelo suporte
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
