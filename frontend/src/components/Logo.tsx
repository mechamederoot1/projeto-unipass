import React from 'react';
import { Activity, Users, ChevronRight } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  variant?: 'default' | 'white' | 'dark';
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '', 
  variant = 'default' 
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };
  
  const textSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl'
  };

  const getLogoColors = () => {
    switch (variant) {
      case 'white':
        return {
          bg: 'bg-white',
          text: 'text-gray-800',
          icon: 'text-primary-600',
          accent: 'text-accent-500'
        };
      case 'dark':
        return {
          bg: 'bg-gray-900',
          text: 'text-white',
          icon: 'text-primary-400',
          accent: 'text-accent-400'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-primary-500 to-primary-700',
          text: 'bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent',
          icon: 'text-white',
          accent: 'text-accent-300'
        };
    }
  };

  const colors = getLogoColors();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
        {/* Main circle with gradient */}
        <div className={`absolute inset-0 ${colors.bg} rounded-2xl shadow-xl transform transition-transform duration-300 hover:scale-105`}>
          {/* Inner geometric pattern */}
          <div className="absolute inset-2 border-2 border-white/30 rounded-xl"></div>
          <div className="absolute inset-4 border border-white/20 rounded-lg"></div>
        </div>
        
        {/* Center icon composition */}
        <div className="relative z-10 flex items-center justify-center">
          {/* Main activity icon */}
          <Activity className={`h-1/2 w-1/2 ${colors.icon} stroke-[2.5]`} />
          {/* Small accent elements */}
          <div className="absolute -top-1 -right-1">
            <div className={`w-2 h-2 ${colors.accent} rounded-full opacity-80`}></div>
          </div>
          <div className="absolute -bottom-1 -left-1">
            <Users className={`h-3 w-3 ${colors.accent} opacity-60`} />
          </div>
        </div>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex items-center">
          <div className={`font-bold ${textSizeClasses[size]} ${colors.text} tracking-tight`}>
            Uni
            <span className="text-accent-500">pass</span>
          </div>
          {size !== 'sm' && (
            <ChevronRight className="h-4 w-4 text-accent-500 ml-1 opacity-60" />
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
