/**
 * Payment provider abstraction.
 * Allows switching between:
 * - Web: Stripe
 * - iOS: Apple In-App Purchase
 * - Android: Google Play Billing
 *
 * For MVP: Stripe placeholder only.
 * Mobile IAP will be added when native apps are built.
 */

export type PaymentPlatform = 'web' | 'ios' | 'android';

export interface PaymentProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'one_time';
  stripePriceId?: string;
  appleProductId?: string;
  googleProductId?: string;
}

export const PRODUCTS: PaymentProduct[] = [
  {
    id: 'founder_pass',
    name: 'Founder Pass',
    price: 29,
    currency: 'EUR',
    interval: 'one_time',
    stripePriceId: 'price_founder_pass', // Replace with real Stripe price ID
    appleProductId: 'com.foundermatch.founderpass',
    googleProductId: 'founder_pass',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 79,
    currency: 'EUR',
    interval: 'month',
    stripePriceId: 'price_premium', // Replace with real Stripe price ID
    appleProductId: 'com.foundermatch.premium',
    googleProductId: 'premium_monthly',
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 199,
    currency: 'EUR',
    interval: 'month',
    stripePriceId: 'price_elite',
    appleProductId: 'com.foundermatch.elite',
    googleProductId: 'elite_monthly',
  },
  {
    id: 'comeback',
    name: 'Comeback Angebot',
    price: 9,
    currency: 'EUR',
    interval: 'one_time',
    stripePriceId: 'price_comeback',
    appleProductId: 'com.foundermatch.comeback',
    googleProductId: 'comeback_7day',
  },
];

/**
 * Detects the current platform.
 */
export function detectPlatform(): PaymentPlatform {
  if (typeof window === 'undefined') return 'web';

  const ua = navigator.userAgent;
  // Capacitor sets these
  if ((window as any).Capacitor?.getPlatform?.() === 'ios') return 'ios';
  if ((window as any).Capacitor?.getPlatform?.() === 'android') return 'android';

  return 'web';
}

/**
 * Initiates a purchase.
 * Routes to the correct provider based on platform.
 */
export async function initiatePurchase(productId: string): Promise<{ success: boolean; error?: string }> {
  const platform = detectPlatform();
  const product = PRODUCTS.find((p) => p.id === productId);

  if (!product) return { success: false, error: 'Produkt nicht gefunden' };

  switch (platform) {
    case 'web':
      return initiateStripePurchase(product);
    case 'ios':
      return initiateApplePurchase(product);
    case 'android':
      return initiateGooglePurchase(product);
  }
}

async function initiateStripePurchase(product: PaymentProduct): Promise<{ success: boolean; error?: string }> {
  // TODO: Create Stripe Checkout session via API route
  // const response = await fetch('/api/stripe/checkout', {
  //   method: 'POST',
  //   body: JSON.stringify({ priceId: product.stripePriceId }),
  // });
  // const { url } = await response.json();
  // window.location.href = url;

  alert(`Stripe Checkout für "${product.name}" wird vorbereitet (${product.price} €).`);
  return { success: false, error: 'Stripe noch nicht konfiguriert' };
}

async function initiateApplePurchase(product: PaymentProduct): Promise<{ success: boolean; error?: string }> {
  // TODO: Use Capacitor In-App Purchase plugin
  // const { InAppPurchase2 } = await import('@capgo/capacitor-purchases');
  // await InAppPurchase2.purchaseProduct(product.appleProductId!);

  return { success: false, error: 'Apple IAP noch nicht konfiguriert' };
}

async function initiateGooglePurchase(product: PaymentProduct): Promise<{ success: boolean; error?: string }> {
  // TODO: Use Capacitor In-App Purchase plugin

  return { success: false, error: 'Google Play Billing noch nicht konfiguriert' };
}
