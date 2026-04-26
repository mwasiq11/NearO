import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Rating } from '@/components/common/Rating';
import { formatPrice } from '@/utils/formatters';
import { getCategoryImage } from '@/utils/categoryImages';

interface ServiceCardProps {
  listing: {
    id: string;
    title: string;
    category: string;
    images?: string[];
    location: {
      neighborhood?: string;
      city?: string;
    };
    rating?: number;
    reviewCount?: number;
    price: number;
    priceType?: string;
    currency?: string;
    remainingQuantity?: number | null;
    isInStock?: boolean;
  };
  onClick: (listingId: string) => void;
}

export default function ServiceCard({ listing, onClick }: ServiceCardProps) {
  const imageUrl = listing.images?.[0] || getCategoryImage(listing.category);
  const hasReviews = (listing.reviewCount ?? 0) > 0;
  const isInStock = listing.isInStock ?? true;
  const stockLabel = listing.remainingQuantity === null || listing.remainingQuantity === undefined
    ? 'Available'
    : `${listing.remainingQuantity} left`;

  return (
    <Card
      className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg cursor-pointer"
      onClick={() => onClick(listing.id)}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imageUrl}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-200 ease-in-out group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        <div className="absolute left-3 top-3">
          <Badge
            variant="secondary"
            className="h-6 rounded-full border border-white/30 bg-white/70 px-2.5 text-[11px] font-semibold text-foreground backdrop-blur-md dark:bg-black/45 dark:text-white"
          >
            {listing.category}
          </Badge>
        </div>
        <div className="absolute right-3 top-3">
          <Badge
            variant={isInStock ? 'success' : 'destructive'}
            className="h-6 rounded-full border border-white/20 px-2.5 text-[11px] font-bold shadow-sm backdrop-blur-sm"
          >
            {isInStock ? stockLabel : 'Out of stock'}
          </Badge>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground transition-colors duration-200 group-hover:text-primary">
          {listing.title}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span className="truncate">{listing.location.neighborhood || listing.location.city || 'Unknown area'}</span>
        </div>

        <div className="flex items-center justify-between border-t border-border/60 pt-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Rating value={listing.rating ?? 0} size="sm" showValue={false} />
              <span className="text-xs font-medium text-muted-foreground">
                {hasReviews ? `(${listing.reviewCount})` : 'No ratings yet'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold tracking-tight text-primary">
              {formatPrice(listing.price, listing.priceType, listing.currency)}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
