import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CommunityFeed } from '@/components/community/feed';
import Link from 'next/link';
import { Users, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function CommunityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Check membership
  const { data: membership } = await supabase
    .from('community_members')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!membership) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Inner Circle Community
        </h2>
        <p className="text-text-secondary text-sm mb-6">
          Geschlossene Community für ambitionierte Männer. Austausch, Accountability-Pods, Live-Calls und mehr.
        </p>
        <Link href="/pricing">
          <Button size="lg">
            <Users className="w-4 h-4 mr-2" />
            Community beitreten — ab 49 €/Monat
          </Button>
        </Link>
      </div>
    );
  }

  // Get posts
  const { data: posts } = await supabase
    .from('community_posts')
    .select('*, author:profiles!community_posts_author_id_fkey(id, first_name, profile_image_url, verification_status)')
    .eq('is_flagged', false)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              Inner Circle
            </h1>
            <p className="text-text-secondary text-sm">
              Level {membership.level} • {membership.points} Punkte
            </p>
          </div>
        </div>
      </div>
      <CommunityFeed posts={posts || []} currentUserId={user.id} />
    </div>
  );
}
