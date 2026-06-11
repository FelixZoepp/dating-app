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

  // Verify match belongs to user
  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (!match || (match.profile_a !== user.id && match.profile_b !== user.id)) {
    redirect('/matches');
  }

  const partnerId = match.profile_a === user.id ? match.profile_b : match.profile_a;

  const { data: partner } = await supabase
    .from('profiles')
    .select('id, first_name, profile_image_url, city, age')
    .eq('id', partnerId)
    .single();

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  return (
    <ChatWindow
      matchId={matchId}
      currentUserId={user.id}
      partner={partner || { id: partnerId, first_name: 'Nutzer', profile_image_url: null, city: null, age: null }}
      initialMessages={messages || []}
    />
  );
}
