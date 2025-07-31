import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import NotificationBell from './NotificationBell';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  const navItems = [
    { name: 'Início', path: '/' },
    { name: 'Check-in', path: '/checkin' },
    { name: 'Perfil', path: '/profile', requiresAuth: true },
  ];

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <Logo size="sm" showText={true} />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              if (item.requiresAuth && !isAuthenticated) return null;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`${
                    isActiveRoute(item.path)
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-600 hover:text-primary-600'
                  } px-3 py-2 text-sm font-medium transition-colors duration-200`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <NotificationBell />
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors duration-200"
                >
                  <User size={20} />
                  <span>{user?.name || 'Perfil'}</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors duration-200"
                >
                  <LogOut size={20} />
                  <span>Sair</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-primary-600 px-4 py-2 text-sm font-medium transition-colors duration-200"
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm"
                >
                  Cadastrar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 p-2"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
              {navItems.map((item) => {
                if (item.requiresAuth && !isAuthenticated) return null;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`${
                      isActiveRoute(item.path)
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                    } block px-3 py-2 text-base font-medium rounded-md transition-colors duration-200`}
                  >
                    {item.name}
                  </Link>
                );
              })}

              {/* Mobile Auth Buttons */}
              <div className="pt-4 border-t border-gray-200">
                {isAuthenticated ? (
                  <div className="space-y-1">
                    <Link
                      to="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 block px-3 py-2 text-base font-medium rounded-md transition-colors duration-200"
                    >
                      <User size={20} />
                      <span>{user?.name || 'Perfil'}</span>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center space-x-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 w-full text-left px-3 py-2 text-base font-medium rounded-md transition-colors duration-200"
                    >
                      <LogOut size={20} />
                      <span>Sair</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-gray-600 hover:text-primary-600 hover:bg-gray-50 block px-3 py-2 text-base font-medium rounded-md transition-colors duration-200"
                    >
                      Entrar
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="bg-primary-600 hover:bg-primary-700 text-white block px-3 py-2 text-base font-medium rounded-md transition-colors duration-200"
                    >
                      Cadastrar
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
