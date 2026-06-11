import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }
  return _stripe;
}

export const STRIPE_PRICES: Record<string, { priceId: string; mode: 'subscription' | 'payment' }> = {
  app_premium: { priceId: process.env.STRIPE_PRICE_PREMIUM || 'price_premium', mode: 'subscription' },
  app_elite: { priceId: process.env.STRIPE_PRICE_ELITE || 'price_elite', mode: 'subscription' },
  community_monthly: { priceId: process.env.STRIPE_PRICE_COMMUNITY || 'price_community', mode: 'subscription' },
  community_yearly: { priceId: process.env.STRIPE_PRICE_COMMUNITY_YEARLY || 'price_community_yearly', mode: 'subscription' },
  signature_course: { priceId: process.env.STRIPE_PRICE_COURSE || 'price_course', mode: 'payment' },
  coaching_session: { priceId: process.env.STRIPE_PRICE_COACHING || 'price_coaching', mode: 'payment' },
  coaching_package: { priceId: process.env.STRIPE_PRICE_COACHING_PKG || 'price_coaching_pkg', mode: 'payment' },
  profile_dfy: { priceId: process.env.STRIPE_PRICE_DFY || 'price_dfy', mode: 'payment' },
  photoshoot: { priceId: process.env.STRIPE_PRICE_PHOTO || 'price_photo', mode: 'payment' },
  transformation_bundle: { priceId: process.env.STRIPE_PRICE_BUNDLE || 'price_bundle', mode: 'payment' },
};
