import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (!subs || subs.length === 0) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 404 });
  }

  // Cancel all active subscriptions at period end
  for (const sub of subs) {
    if (sub.stripe_subscription_id) {
      await getStripe().subscriptions.update(sub.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    }
  }

  return NextResponse.json({ success: true, message: 'Abo wird zum Ende der Laufzeit gekündigt.' });
}
