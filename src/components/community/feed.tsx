'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle, Heart, Shield, Pin } from 'lucide-react';

interface Post {
  id: string;
  body: string;
  channel: string;
  created_at: string;
  is_pinned: boolean;
  likes_count: number;
  author: {
    id: string;
    first_name: string | null;
    profile_image_url: string | null;
    verification_status: string;
  };
}

interface Props {
  posts: Post[];
  currentUserId: string;
}

const CHANNEL_LABELS: Record<string, string> = {
  general: 'Allgemein',
  wins: 'Erfolge',
  advice: 'Ratschläge',
  accountability: 'Accountability',
  introductions: 'Vorstellungen',
};

export function CommunityFeed({ posts, currentUserId }: Props) {
  const [newPost, setNewPost] = useState('');
  const [channel, setChannel] = useState('general');
  const [posting, setPosting] = useState(false);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const router = useRouter();

  const filteredPosts = activeChannel
    ? posts.filter((p) => p.channel === activeChannel)
    : posts;

  async function handlePost() {
    if (!newPost.trim() || posting) return;
    setPosting(true);

    const supabase = createClient();
    await supabase.from('community_posts').insert({
      author_id: currentUserId,
      body: newPost.trim(),
      channel,
    });

    setNewPost('');
    setPosting(false);
    router.refresh();
  }

  return (
    <div>
      {/* Channel filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveChannel(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            !activeChannel ? 'bg-accent-muted text-accent' : 'text-text-secondary hover:text-foreground bg-surface'
          }`}
        >
          Alle
        </button>
        {Object.entries(CHANNEL_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveChannel(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeChannel === key ? 'bg-accent-muted text-accent' : 'text-text-secondary hover:text-foreground bg-surface'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* New post */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Teile etwas mit der Community..."
            className="w-full px-4 py-3 rounded-xl border border-border bg-surface-2 text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent resize-none h-20 text-sm mb-3"
          />
          <div className="flex items-center justify-between">
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-surface-2 text-text-secondary text-xs focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {Object.entries(CHANNEL_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <Button size="sm" onClick={handlePost} disabled={posting || !newPost.trim()}>
              <Send className="w-3.5 h-3.5 mr-1" />
              Posten
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <Card key={post.id}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent-muted rounded-full flex items-center justify-center shrink-0">
                  {post.author.profile_image_url ? (
                    <img src={post.author.profile_image_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-accent">{post.author.first_name?.charAt(0) || '?'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground text-sm">{post.author.first_name}</span>
                    {post.author.verification_status === 'verified' && (
                      <Shield className="w-3.5 h-3.5 text-accent" />
                    )}
                    <Badge variant="default" className="text-[10px]">{CHANNEL_LABELS[post.channel] || post.channel}</Badge>
                    {post.is_pinned && <Pin className="w-3 h-3 text-accent" />}
                  </div>
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">{post.body}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-text-secondary">
                    <span>{new Date(post.created_at).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}</span>
                    <button className="flex items-center gap-1 hover:text-accent transition-colors">
                      <Heart className="w-3.5 h-3.5" /> {post.likes_count}
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredPosts.length === 0 && (
          <div className="text-center py-12 text-text-secondary text-sm">
            Noch keine Beiträge in diesem Kanal.
          </div>
        )}
      </div>
    </div>
  );
}
