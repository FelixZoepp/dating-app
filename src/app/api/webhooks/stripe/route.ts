import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createServerClient } from '@supabase/ssr';
import Stripe from 'stripe';

// Use service role for webhook — needs to bypass RLS
function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      const productKey = session.metadata?.product_key;
      if (!userId || !productKey) break;

      if (session.mode === 'subscription') {
        await handleSubscriptionCreated(supabase, userId, productKey, session);
      } else {
        await handleOneTimePurchase(supabase, userId, productKey, session);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(supabase, sub);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(supabase, sub);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = (invoice as any).subscription as string | null;
      if (subId) {
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', subId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

async function handleSubscriptionCreated(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  productKey: string,
  session: Stripe.Checkout.Session
) {
  const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

  // Determine tier and plan
  const tierMap: Record<string, string> = {
    app_premium: 'premium',
    app_elite: 'elite',
    community_monthly: 'community',
    community_yearly: 'community_yearly',
  };
  const tier = tierMap[productKey] || productKey;

  // Upsert subscription
  await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_subscription_id: subId,
    stripe_customer_id: customerId,
    tier,
    status: 'active',
    current_period_start: new Date().toISOString(),
  }, { onConflict: 'stripe_subscription_id' });

  // Update profile plan (via service role — bypasses trigger protection)
  const planMap: Record<string, string> = {
    app_premium: 'premium',
    app_elite: 'elite',
  };
  if (planMap[productKey]) {
    await supabase
      .from('profiles')
      .update({ plan: planMap[productKey] })
      .eq('id', userId);
  }

  // Auto-join community if community subscription
  if (productKey.startsWith('community')) {
    await supabase.from('community_members').upsert({
      user_id: userId,
      tier: productKey === 'community_yearly' ? 'founding' : 'member',
      status: 'active',
    }, { onConflict: 'user_id' });
  }

  // Track event
  await supabase.from('analytics_events').insert({
    user_id: userId,
    event_name: `${productKey}_purchased`,
    metadata: { stripe_session: session.id, tier },
  });
}

async function handleOneTimePurchase(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  productKey: string,
  session: Stripe.Checkout.Session
) {
  await supabase.from('purchases').insert({
    user_id: userId,
    product: productKey,
    stripe_payment_id: session.payment_intent as string,
    amount: session.amount_total || 0,
    status: 'completed',
  });

  // Auto-grant access based on product
  if (productKey === 'signature_course') {
    // Course access is granted via purchases table + RLS
  }

  if (productKey === 'transformation_bundle') {
    // Bundle = Premium + Community + Course + Coaching
    await supabase.from('profiles').update({ plan: 'premium' }).eq('id', userId);
    await supabase.from('community_members').upsert({
      user_id: userId, tier: 'vip', status: 'active',
    }, { onConflict: 'user_id' });
  }

  await supabase.from('analytics_events').insert({
    user_id: userId,
    event_name: `${productKey}_purchased`,
    metadata: { stripe_session: session.id, amount: session.amount_total },
  });
}

async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof createServiceClient>,
  sub: Stripe.Subscription
) {
  const subData = sub as any;
  await supabase
    .from('subscriptions')
    .update({
      status: sub.status as string,
      current_period_end: subData.current_period_end
        ? new Date(subData.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: subData.cancel_at_period_end ?? false,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', sub.id);
}

async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createServiceClient>,
  sub: Stripe.Subscription
) {
  // Find the subscription
  const { data: dbSub } = await supabase
    .from('subscriptions')
    .select('user_id, tier')
    .eq('stripe_subscription_id', sub.id)
    .single();

  if (!dbSub) return;

  // Mark canceled
  await supabase
    .from('subscriptions')
    .update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq('stripe_subscription_id', sub.id);

  // Revoke access
  if (['premium', 'elite'].includes(dbSub.tier)) {
    // Check if user has other active subscriptions
    const { count } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', dbSub.user_id)
      .eq('status', 'active')
      .in('tier', ['premium', 'elite']);

    if (!count || count === 0) {
      await supabase.from('profiles').update({ plan: 'basic' }).eq('id', dbSub.user_id);
    }
  }

  if (dbSub.tier.startsWith('community')) {
    await supabase
      .from('community_members')
      .update({ status: 'churned' })
      .eq('user_id', dbSub.user_id);
  }

  await supabase.from('analytics_events').insert({
    user_id: dbSub.user_id,
    event_name: 'subscription_canceled',
    metadata: { tier: dbSub.tier },
  });
}
