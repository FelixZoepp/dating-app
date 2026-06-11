'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { trackEventAsync } from '@/lib/analytics/trackEvent';
import type { Offer } from '@/types';
import { X, Crown, Sparkles, ArrowRight } from 'lucide-react';

interface Props {
  offer: Offer;
  userId: string;
}

export function OfferBanner({ offer, userId }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  function handleClick() {
    const supabase = createClient();
    trackEventAsync(supabase, userId, `${offer.type}_clicked` as any, { offerId: offer.id });
  }

  function handleDismiss() {
    setDismissed(true);
    const supabase = createClient();
    trackEventAsync(supabase, userId, 'paywall_viewed' as any, { offerId: offer.id, dismissed: true });
  }

  const isUrgent = offer.type === 'trial_ending' || offer.type === 'comeback';

  return (
    <div className={`mb-6 rounded-2xl p-5 relative ${
      isUrgent
        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
        : 'bg-gradient-to-r from-zinc-900 to-zinc-800 text-white'
    }`}>
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
          {offer.type === 'concierge' ? (
            <Sparkles className="w-5 h-5" />
          ) : (
            <Crown className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">{offer.headline}</h3>
          <p className={`text-xs mb-3 ${isUrgent ? 'text-white/80' : 'text-zinc-400'}`}>
            {offer.description}
          </p>
          <div className="flex items-center gap-3">
            <Link
              href={offer.ctaLink}
              onClick={handleClick}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                isUrgent
                  ? 'bg-white text-amber-700 hover:bg-white/90'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              {offer.ctaText}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            {offer.price && (
              <span className={`text-xs ${isUrgent ? 'text-white/70' : 'text-zinc-500'}`}>
                ab {offer.price}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
