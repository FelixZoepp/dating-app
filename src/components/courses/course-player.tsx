'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { CheckCircle, Circle, Play, Lock, ChevronDown, ChevronRight } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  video_playback_id: string | null;
  duration_seconds: number | null;
  sort_order: number;
  is_free_preview: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  lessons: Lesson[];
}

interface Props {
  course: { id: string; title: string; description: string | null };
  modules: Module[];
  completedLessons: Set<string>;
  userId: string;
}

export function CoursePlayer({ course, modules, completedLessons, userId }: Props) {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(modules.map((m) => m.id)));
  const [completed, setCompleted] = useState(completedLessons);
  const router = useRouter();

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedCount = Array.from(completed).length;
  const progressPercent = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  function toggleModule(moduleId: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }

  async function markComplete(lessonId: string) {
    if (completed.has(lessonId)) return;
    const supabase = createClient();
    await supabase.from('lesson_progress').insert({
      user_id: userId,
      lesson_id: lessonId,
    });
    setCompleted((prev) => new Set([...prev, lessonId]));
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          {course.title}
        </h1>
        <ProgressBar value={progressPercent} showLabel />
        <p className="text-xs text-text-secondary mt-2">{completedCount} von {totalLessons} Lektionen abgeschlossen</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Video area */}
        <div className="lg:col-span-2">
          {activeLesson ? (
            <Card>
              <div className="aspect-video bg-surface-2 rounded-t-2xl flex items-center justify-center">
                {activeLesson.video_playback_id ? (
                  <div className="text-center">
                    <Play className="w-12 h-12 text-accent mx-auto mb-2" />
                    <p className="text-text-secondary text-sm">Video-Player wird geladen...</p>
                    <p className="text-text-secondary text-xs mt-1">Playback ID: {activeLesson.video_playback_id}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Play className="w-12 h-12 text-text-secondary mx-auto mb-2" />
                    <p className="text-text-secondary text-sm">Video wird bald verfügbar sein</p>
                  </div>
                )}
              </div>
              <CardContent className="p-6">
                <h2 className="text-lg font-bold text-foreground mb-2">{activeLesson.title}</h2>
                {activeLesson.description && (
                  <p className="text-sm text-text-secondary mb-4">{activeLesson.description}</p>
                )}
                <Button
                  onClick={() => markComplete(activeLesson.id)}
                  disabled={completed.has(activeLesson.id)}
                  variant={completed.has(activeLesson.id) ? 'secondary' : 'primary'}
                >
                  {completed.has(activeLesson.id) ? (
                    <><CheckCircle className="w-4 h-4 mr-2" />Abgeschlossen</>
                  ) : (
                    <><Circle className="w-4 h-4 mr-2" />Als abgeschlossen markieren</>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-20 text-center">
                <Play className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                <p className="text-text-secondary">Wähle eine Lektion aus der Sidebar.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: Module list */}
        <div className="space-y-3">
          {modules.sort((a, b) => a.sort_order - b.sort_order).map((mod) => {
            const isExpanded = expandedModules.has(mod.id);
            const modCompleted = mod.lessons.filter((l) => completed.has(l.id)).length;

            return (
              <Card key={mod.id}>
                <button
                  onClick={() => toggleModule(mod.id)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{mod.title}</h3>
                    <p className="text-xs text-text-secondary">{modCompleted}/{mod.lessons.length} abgeschlossen</p>
                  </div>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-text-secondary" /> : <ChevronRight className="w-4 h-4 text-text-secondary" />}
                </button>
                {isExpanded && (
                  <div className="border-t border-border">
                    {mod.lessons.sort((a, b) => a.sort_order - b.sort_order).map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={() => setActiveLesson(lesson)}
                        className={`w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-surface-2 transition-colors border-b border-border last:border-0 ${
                          activeLesson?.id === lesson.id ? 'bg-accent-muted' : ''
                        }`}
                      >
                        {completed.has(lesson.id) ? (
                          <CheckCircle className="w-4 h-4 text-accent shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-text-secondary shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className={`text-sm truncate ${activeLesson?.id === lesson.id ? 'text-accent font-medium' : 'text-foreground'}`}>
                            {lesson.title}
                          </div>
                          {lesson.duration_seconds && (
                            <div className="text-xs text-text-secondary">{Math.round(lesson.duration_seconds / 60)} Min.</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
