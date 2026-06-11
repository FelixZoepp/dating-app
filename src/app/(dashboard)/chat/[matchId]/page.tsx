import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChatWindow } from '@/components/chat/chat-window';

interface Props {
  params: Promise<{ matchId: string }>;
}

export default async function ChatPage({ params }: Props) {
  const { matchId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (!match || (match.profile_a !== user.id && match.profile_b !== user.id)) {
    redirect('/matches');
  }

  const partnerId = match.profile_a === user.id ? match.profile_b : match.profile_a;

  const [{ data: partner }, { data: messages }, { data: myProfile }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, first_name, profile_image_url, city, age, verification_status')
      .eq('id', partnerId)
      .single(),
    supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true }),
    supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single(),
  ]);

  // Determine if this user sent the first like (initiator)
  const { data: firstLike } = await supabase
    .from('likes')
    .select('from_profile_id')
    .or(`and(from_profile_id.eq.${user.id},to_profile_id.eq.${partnerId}),and(from_profile_id.eq.${partnerId},to_profile_id.eq.${user.id})`)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  const isInitiator = firstLike?.from_profile_id === user.id;

  return (
    <ChatWindow
      matchId={matchId}
      currentUserId={user.id}
      partner={partner || { id: partnerId, first_name: 'Nutzer', profile_image_url: null, city: null, age: null }}
      initialMessages={messages || []}
      userPlan={myProfile?.plan || 'basic'}
      isInitiator={isInitiator}
    />
  );
}
