import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  onRatingChange?: (rating: number) => void;
  showValue?: boolean;
  className?: string;
}

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  readonly = true,
  onRatingChange,
  showValue = false,
  className = ''
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (!readonly) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const getStarColor = (starIndex: number) => {
    const displayRating = hoverRating || rating;
    
    if (starIndex <= displayRating) {
      return 'text-yellow-500 fill-current';
    } else if (starIndex - 0.5 <= displayRating) {
      return 'text-yellow-500 fill-current opacity-50';
    } else {
      return 'text-gray-300';
    }
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className="flex">
        {Array.from({ length: maxRating }, (_, index) => {
          const starIndex = index + 1;
          return (
            <button
              key={starIndex}
              type="button"
              className={`${
                readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
              } transition-transform duration-150`}
              onClick={() => handleClick(starIndex)}
              onMouseEnter={() => handleMouseEnter(starIndex)}
              onMouseLeave={handleMouseLeave}
              disabled={readonly}
            >
              <Star 
                className={`${sizeClasses[size]} ${getStarColor(starIndex)} transition-colors duration-150`}
              />
            </button>
          );
        })}
      </div>
      
      {showValue && (
        <span className="text-sm text-gray-600 ml-2">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
