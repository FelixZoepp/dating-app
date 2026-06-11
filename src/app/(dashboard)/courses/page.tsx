import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Lock, CheckCircle, ArrowRight } from 'lucide-react';

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('created_at');

  // Check if user has purchased
  const { data: purchases } = await supabase
    .from('purchases')
    .select('product')
    .eq('user_id', user.id)
    .eq('status', 'completed');

  const { data: communityMember } = await supabase
    .from('community_members')
    .select('status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  const purchasedProducts = new Set(purchases?.map((p) => p.product) || []);
  const hasAccess = purchasedProducts.has('signature_course') || purchasedProducts.has('transformation_bundle') || !!communityMember;

  if (!courses || courses.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Kurse kommen bald</h2>
        <p className="text-text-secondary text-sm">Das Signature-Programm wird aktuell erstellt.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: 'var(--font-display)' }}>Kurse</h1>
        <p className="text-text-secondary text-sm">Dein Weg zur erfolgreichen Partnerschaft.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {courses.map((course) => (
          <Card key={course.id} className="overflow-hidden">
            <div className="h-40 bg-gradient-to-br from-accent-muted to-surface-2 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-accent" />
            </div>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-2">{course.title}</h3>
              {course.description && (
                <p className="text-sm text-text-secondary mb-4">{course.description}</p>
              )}
              {hasAccess ? (
                <Link href={`/courses/${course.id}`}>
                  <Button className="w-full">
                    Kurs starten <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Link href="/pricing">
                  <Button variant="outline" className="w-full">
                    <Lock className="w-4 h-4 mr-2" />
                    Freischalten — 499 €
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
