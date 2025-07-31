import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import RatingStars from './RatingStars';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  gymName: string;
  onSubmit: (review: { rating: number; comment: string }) => void;
  isSubmitting?: boolean;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  gymName,
  onSubmit,
  isSubmitting = false
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    
    onSubmit({ rating, comment });
    
    // Reset form
    setRating(0);
    setComment('');
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Avaliar Academia
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {gymName}
            </h3>
            <p className="text-gray-600 text-sm">
              Como foi sua experiência nesta academia?
            </p>
          </div>

          {/* Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Sua avaliação *
            </label>
            <div className="flex justify-center">
              <RatingStars
                rating={rating}
                readonly={false}
                onRatingChange={setRating}
                size="lg"
              />
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-gray-600 mt-2">
                {rating === 1 && 'Muito ruim'}
                {rating === 2 && 'Ruim'}
                {rating === 3 && 'Regular'}
                {rating === 4 && 'Bom'}
                {rating === 5 && 'Excelente'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentário (opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Conte sobre sua experiência..."
              maxLength={500}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {comment.length}/500
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={rating === 0 || isSubmitting}
              className="flex-1 py-3 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </div>
              ) : (
                <div className="flex items-center">
                  <Send size={16} className="mr-2" />
                  Enviar Avaliação
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
