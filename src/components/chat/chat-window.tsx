'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, Shield, MoreVertical, Flag, Ban } from 'lucide-react';
import Link from 'next/link';
import type { Message } from '@/types';

interface Partner {
  id: string;
  first_name: string | null;
  profile_image_url: string | null;
  city: string | null;
  age: number | null;
  verification_status?: string;
}

interface Props {
  matchId: string;
  currentUserId: string;
  partner: Partner;
  initialMessages: Message[];
  userPlan: string;
  isInitiator: boolean;
}

export function ChatWindow({ matchId, currentUserId, partner, initialMessages, userPlan, isInitiator }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Free users can only respond, not initiate
  const canInitiateChat = userPlan !== 'basic' || messages.some((m) => m.sender_id !== currentUserId);
  const isFreeBlocked = userPlan === 'basic' && messages.length === 0 && !messages.some((m) => m.sender_id !== currentUserId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`chat:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || sending || !canInitiateChat) return;

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
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data as Message];
      });
      setNewMessage('');
    }
    setSending(false);
  }

  async function handleBlock() {
    const supabase = createClient();
    await supabase.from('blocks').insert({
      from_profile_id: currentUserId,
      to_profile_id: partner.id,
    });
    window.location.href = '/matches';
  }

  async function handleReport(reason: string, details: string) {
    const supabase = createClient();
    await supabase.from('reports').insert({
      reporter_id: currentUserId,
      reported_id: partner.id,
      reason,
      details,
    });
    setShowReportModal(false);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
        <div className="flex items-center gap-3">
          <Link href="/matches" className="text-text-secondary hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 bg-accent-muted rounded-full flex items-center justify-center">
            {partner.profile_image_url ? (
              <img src={partner.profile_image_url} alt={partner.first_name || ''} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-accent">{partner.first_name?.charAt(0) || '?'}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-foreground">{partner.first_name}</h2>
              {partner.verification_status === 'verified' && (
                <Shield className="w-3.5 h-3.5 text-accent" />
              )}
            </div>
            <p className="text-xs text-text-secondary">
              {partner.city}{partner.age ? `, ${partner.age}` : ''}
            </p>
          </div>
        </div>

        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="text-text-secondary hover:text-foreground p-1">
            <MoreVertical className="w-5 h-5" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 bg-surface border border-border rounded-xl shadow-lg py-1 z-10 w-48">
              <button
                onClick={() => { setShowMenu(false); setShowReportModal(true); }}
                className="w-full px-4 py-2 text-left text-sm text-text-secondary hover:text-foreground hover:bg-surface-2 flex items-center gap-2"
              >
                <Flag className="w-4 h-4" />
                Melden
              </button>
              <button
                onClick={() => { setShowMenu(false); handleBlock(); }}
                className="w-full px-4 py-2 text-left text-sm text-error hover:bg-surface-2 flex items-center gap-2"
              >
                <Ban className="w-4 h-4" />
                Blockieren
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary text-sm">
              {isFreeBlocked
                ? 'Upgrade auf Premium um die erste Nachricht zu senden.'
                : 'Ihr habt gematcht! Schreib die erste Nachricht.'}
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
                    ? 'bg-accent text-background rounded-br-md'
                    : 'bg-surface-2 text-foreground rounded-bl-md'
                }`}
              >
                {msg.body}
                <div className={`text-[10px] mt-1 ${
                  msg.sender_id === currentUserId ? 'text-background/60' : 'text-text-secondary'
                }`}>
                  {new Date(msg.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {isFreeBlocked ? (
        <div className="pt-4 border-t border-border">
          <Link
            href="/pricing"
            className="block w-full text-center bg-accent text-background py-3 rounded-xl font-semibold hover:bg-accent-hover transition-colors text-sm"
          >
            Premium freischalten um zu schreiben
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSend} className="flex items-center gap-3 pt-4 border-t border-border">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Nachricht schreiben..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
          />
          <Button type="submit" disabled={sending || !newMessage.trim()} size="md">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          partnerName={partner.first_name || 'Nutzer'}
          onSubmit={handleReport}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}

function ReportModal({ partnerName, onSubmit, onClose }: {
  partnerName: string;
  onSubmit: (reason: string, details: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  const reasons = [
    { value: 'fake_profile', label: 'Fake-Profil' },
    { value: 'harassment', label: 'Belästigung' },
    { value: 'inappropriate_content', label: 'Unangemessene Inhalte' },
    { value: 'spam', label: 'Spam' },
    { value: 'offensive_language', label: 'Beleidigende Sprache' },
    { value: 'scam', label: 'Betrug' },
    { value: 'other', label: 'Sonstiges' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-surface rounded-2xl border border-border p-6 w-full max-w-md animate-fade-in">
        <h3 className="text-lg font-bold text-foreground mb-4">{partnerName} melden</h3>

        <div className="space-y-2 mb-4">
          {reasons.map((r) => (
            <button
              key={r.value}
              onClick={() => setReason(r.value)}
              className={`w-full p-3 rounded-xl border text-left text-sm transition-all ${
                reason === r.value
                  ? 'border-accent bg-accent-muted text-accent'
                  : 'border-border text-text-secondary hover:border-accent/50'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Weitere Details (optional)..."
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-2 text-foreground placeholder:text-text-secondary text-sm resize-none h-20 mb-4 focus:outline-none focus:ring-2 focus:ring-accent"
        />

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">Abbrechen</Button>
          <Button
            variant="danger"
            onClick={() => reason && onSubmit(reason, details)}
            disabled={!reason}
            className="flex-1"
          >
            Melden
          </Button>
        </div>
      </div>
    </div>
  );
}
