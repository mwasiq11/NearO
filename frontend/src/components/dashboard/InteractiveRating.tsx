import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAppSelector } from '@/store/hooks';

interface InteractiveRatingProps {
  serviceId: string;
  initialRating?: number;
  initialComment?: string;
  onRatingSubmitted?: (newRating: number, totalReviews: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export const InteractiveRating = ({
  serviceId,
  initialRating = 0,
  initialComment = '',
  onRatingSubmitted,
  size = 'md',
  readOnly = false,
}: InteractiveRatingProps) => {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(initialComment);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  
  const { user, isAuthenticated } = useAppSelector(state => state.auth);

  useEffect(() => {
    setRating(initialRating);
    setComment(initialComment);
  }, [initialRating, initialComment]);

  const handleRate = async (value: number) => {
    if (!isAuthenticated) {
      toast.error('Please login to rate this service');
      return;
    }

    if (readOnly) return;

    setRating(value);
    setShowCommentForm(true);
    
    // We can auto-submit or wait for comment. 
    // User goal: "On star click: Send POST /reviews"
    // So let's auto-submit the rating immediately, then allow updating with comment.
    await submitReview(value, comment);
  };

  const submitReview = async (value: number, text: string) => {
    setIsSubmitting(true);
    try {
      const response = await api.post<any>('/reviews', {
        service_id: serviceId,
        rating: value,
        comment: text
      }, { auth: true });

      toast.success('Rating submitted!');
      if (onRatingSubmitted) {
        // The backend returns the review object, but we need the updated service stats.
        // We'll let the parent handle the refresh or provide the stats.
        onRatingSubmitted(value, 0); // Simplified
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          {rating > 0 ? 'Your Rating' : 'Rate this service'}
        </span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={isSubmitting || readOnly}
              className={cn(
                "transition-all duration-150 hover:scale-110 disabled:opacity-50 disabled:hover:scale-100",
                readOnly ? "cursor-default" : "cursor-pointer"
              )}
              onClick={() => handleRate(star)}
              onMouseEnter={() => !readOnly && setHoverRating(star)}
              onMouseLeave={() => !readOnly && setHoverRating(0)}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  (hoverRating || rating) >= star
                    ? "fill-accent text-accent"
                    : "text-muted-foreground/30"
                )}
              />
            </button>
          ))}
          {rating > 0 && !readOnly && (
            <span className="ml-2 text-sm font-semibold text-accent">
              {rating}/5
            </span>
          )}
        </div>
      </div>

      {showCommentForm && !readOnly && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about your experience (optional)..."
            className="w-full min-h-[100px] rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCommentForm(false)}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              disabled={isSubmitting}
              onClick={() => submitReview(rating, comment)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Update Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
