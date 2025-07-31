import React from 'react';
import { Share } from 'lucide-react';
import { pwaService } from '../services/pwa';

interface ShareButtonProps {
  title?: string;
  text?: string;
  url?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
}

const ShareButton: React.FC<ShareButtonProps> = ({
  title = 'Unipass',
  text = 'Acesse mais de 1000 academias com o Unipass!',
  url,
  className = '',
  size = 'md',
  variant = 'ghost'
}) => {
  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    ghost: 'hover:bg-gray-100 text-gray-600'
  };

  const handleShare = async () => {
    // Add vibration feedback
    pwaService.vibrate(50);

    const shareData = {
      title,
      text,
      url: url || window.location.href
    };

    const shared = await pwaService.shareContent(shareData);
    
    if (!shared) {
      // Fallback for browsers without Web Share API
      try {
        await navigator.clipboard.writeText(shareData.url || window.location.href);
        
        // Show temporary feedback
        const button = document.activeElement as HTMLElement;
        if (button) {
          const originalText = button.textContent;
          button.textContent = 'Link copiado!';
          setTimeout(() => {
            button.textContent = originalText;
          }, 2000);
        }
      } catch (error) {
        console.error('Share fallback failed:', error);
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-lg transition-all duration-200 hover:scale-105 ${className}`}
      title="Compartilhar"
    >
      <Share size={iconSizes[size]} />
    </button>
  );
};

export default ShareButton;
