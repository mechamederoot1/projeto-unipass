import React from 'react';
import { Heart } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface FavoriteButtonProps {
  gymId: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ 
  gymId, 
  size = 'md',
  className = '',
  showText = false
}) => {
  const { favoriteGyms, toggleFavorite } = useApp();
  const isFavorite = favoriteGyms.includes(gymId);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const buttonSizes = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(gymId);
  };

  return (
    <button
      onClick={handleToggle}
      className={`${buttonSizes[size]} rounded-full transition-all duration-200 hover:scale-110 ${
        isFavorite 
          ? 'text-red-500 bg-red-50 hover:bg-red-100' 
          : 'text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-red-400'
      } ${className}`}
      title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      <Heart 
        className={`${sizeClasses[size]} transition-all duration-200 ${
          isFavorite ? 'fill-current' : ''
        }`}
      />
      {showText && (
        <span className="ml-2 text-sm">
          {isFavorite ? 'Favorita' : 'Favoritar'}
        </span>
      )}
    </button>
  );
};

export default FavoriteButton;
