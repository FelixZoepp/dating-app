'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import type { Message } from '@/types';

interface Partner {
  id: string;
  first_name: string | null;
  profile_image_url: string | null;
  city: string | null;
  age: number | null;
}

interface Props {
  matchId: string;
  currentUserId: string;
  partner: Partner;
  initialMessages: Message[];
}

export function ChatWindow({ matchId, currentUserId, partner, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (data && data.length > messages.length) {
        setMessages(data as Message[]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [matchId, messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: currentUserId,
        body: newMessage.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => [...prev, data as Message]);
      setNewMessage('');
    }
    setSending(false);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-200 mb-4">
        <Link href="/matches" className="text-zinc-400 hover:text-zinc-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
          {partner.profile_image_url ? (
            <img
              src={partner.profile_image_url}
              alt={partner.first_name || ''}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-bold text-amber-700">
              {partner.first_name?.charAt(0) || '?'}
            </span>
          )}
        </div>
        <div>
          <h2 className="font-semibold text-zinc-900">{partner.first_name}</h2>
          <p className="text-xs text-zinc-500">
            {partner.city}{partner.age ? `, ${partner.age}` : ''}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-400 text-sm">
              Ihr habt gematcht! Schreib die erste Nachricht.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                  msg.sender_id === currentUserId
                    ? 'bg-amber-600 text-white rounded-br-md'
                    : 'bg-zinc-100 text-zinc-900 rounded-bl-md'
                }`}
              >
                {msg.body}
                <div
                  className={`text-[10px] mt-1 ${
                    msg.sender_id === currentUserId ? 'text-amber-200' : 'text-zinc-400'
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-3 pt-4 border-t border-zinc-200">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Nachricht schreiben..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
        />
        <Button type="submit" disabled={sending || !newMessage.trim()} size="md">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
