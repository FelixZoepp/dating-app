import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe, STRIPE_PRICES } from '@/lib/stripe';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productKey } = await request.json();
  const priceConfig = STRIPE_PRICES[productKey];

  if (!priceConfig) {
    return NextResponse.json({ error: 'Invalid product' }, { status: 400 });
  }

  // Get or create Stripe customer
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single();

  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .not('stripe_customer_id', 'is', null)
    .limit(1)
    .single();

  let customerId = existingSub?.stripe_customer_id;

  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: profile?.email || user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
  }

  const origin = request.headers.get('origin') || 'http://localhost:3000';

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    mode: priceConfig.mode,
    line_items: [{ price: priceConfig.priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?checkout=success&product=${productKey}`,
    cancel_url: `${origin}/pricing?checkout=canceled`,
    metadata: {
      supabase_user_id: user.id,
      product_key: productKey,
    },
    allow_promotion_codes: true,
  };

  // Add trial for premium subscription
  if (productKey === 'app_premium' && priceConfig.mode === 'subscription') {
    sessionParams.subscription_data = {
      trial_period_days: 3,
      metadata: { supabase_user_id: user.id, product_key: productKey },
    };
  }

  const session = await getStripe().checkout.sessions.create(sessionParams);

  return NextResponse.json({ url: session.url });
}
