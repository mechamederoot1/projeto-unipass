import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Clock, CheckCircle } from 'lucide-react';
import Logo from '../components/Logo';

const Homepage: React.FC = () => {
  const features = [
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: 'Check-in Rápido',
      description: 'Faça check-in em academias parceiras com apenas um toque'
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: 'Academias Próximas',
      description: 'Encontre academias parceiras próximas à sua localização'
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Horários Flexíveis',
      description: 'Acesse academias 24h com flexibilidade total'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Rede Extensa',
      description: 'Mais de 1000 academias parceiras em todo o país'
    }
  ];

  const stats = [
    { number: '1000+', label: 'Academias Parceiras' },
    { number: '50k+', label: 'Usuários Ativos' },
    { number: '100k+', label: 'Check-ins Realizados' },
    { number: '24/7', label: 'Suporte Disponível' }
  ];

  return (
    <div className="min-h-screen-safe bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 via-transparent to-accent-500/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <Logo size="lg" showText={true} />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Sua academia em
              <span className="block bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                qualquer lugar
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Acesse mais de 1000 academias parceiras com um único passe. 
              Flexibilidade total para treinar onde e quando quiser.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/register"
                className="btn-primary text-lg px-8 py-4 w-full sm:w-auto"
              >
                Começar Agora
              </Link>
              <Link
                to="/checkin"
                className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto"
              >
                Fazer Check-in
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Por que escolher o Unipass?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Desenvolvido para oferecer a melhor experiência de treino com máxima flexibilidade
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card text-center hover:shadow-lg transition-shadow duration-300">
                <div className="bg-primary-100 text-primary-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para começar?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de pessoas que já descobriram a liberdade de treinar em qualquer academia
          </p>
          <Link
            to="/register"
            className="bg-white text-primary-600 hover:bg-gray-100 font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-200 inline-block"
          >
            Criar Conta Grátis
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
