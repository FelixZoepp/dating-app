import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CoursePlayer } from '@/components/courses/course-player';

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function CourseDetailPage({ params }: Props) {
  const { courseId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Check access
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

  if (!hasAccess) redirect('/pricing');

  // Get course with modules and lessons
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (!course) redirect('/courses');

  const { data: modules } = await supabase
    .from('modules')
    .select('*, lessons(*)')
    .eq('course_id', courseId)
    .order('sort_order');

  // Get progress
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_id')
    .eq('user_id', user.id);

  const completedLessons = new Set(progress?.map((p) => p.lesson_id) || []);

  return (
    <CoursePlayer
      course={course}
      modules={modules || []}
      completedLessons={completedLessons}
      userId={user.id}
    />
  );
}
