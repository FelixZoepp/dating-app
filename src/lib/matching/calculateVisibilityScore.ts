import type { Profile } from '@/types';

interface VisibilityFactors {
  profileCompleteness: number;
  verification: number;
  recentActivity: number;
  responseRate: number;
  photoQuality: number;
  premiumStatus: number;
  eliteStatus: number;
}

const VISIBILITY_WEIGHTS = {
  profileCompleteness: 0.20,
  verification: 0.20,
  recentActivity: 0.15,
  responseRate: 0.15,
  photoQuality: 0.10,
  premiumStatus: 0.10,
  eliteStatus: 0.10,
};

export function calculateVisibilityScore(profile: Profile & {
  last_active_at?: string | null;
  response_rate?: number;
  total_likes_received?: number;
  total_messages_sent?: number;
}): { score: number; factors: VisibilityFactors } {
  // Profile completeness (0-100)
  const requiredFields = [
    profile.first_name,
    profile.age,
    profile.city,
    profile.gender,
    profile.seeking_gender,
    profile.relationship_goal,
    profile.children_wish,
    profile.career_focus,
    profile.family_orientation,
    profile.relationship_model,
    profile.bio,
    profile.life_in_5_years,
    profile.looking_for,
    profile.unique_trait,
  ];
  const filledCount = requiredFields.filter(Boolean).length;
  const profileCompleteness = Math.round((filledCount / requiredFields.length) * 100);

  // Verification (0-100)
  const verification = profile.verification_status === 'verified' ? 100
    : profile.verification_status === 'pending' ? 40
    : 10;

  // Recent activity (0-100)
  let recentActivity = 30;
  if (profile.last_active_at) {
    const lastActive = new Date(profile.last_active_at);
    const now = new Date();
    const daysSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceActive < 1) recentActivity = 100;
    else if (daysSinceActive < 3) recentActivity = 80;
    else if (daysSinceActive < 7) recentActivity = 60;
    else if (daysSinceActive < 14) recentActivity = 35;
    else recentActivity = 10;
  }

  // Response rate (0-100)
  const responseRate = Math.min(100, Math.round((profile.response_rate ?? 0) * 100));

  // Photo quality (0-100) - based on number of photos
  let photoQuality = 0;
  if (profile.profile_image_url) photoQuality += 50;
  const galleryCount = profile.gallery_image_urls?.length ?? 0;
  photoQuality += Math.min(50, galleryCount * 10);

  // Premium status (0-100)
  const premiumStatus = ['premium', 'elite', 'concierge'].includes(profile.plan) ? 100 : 0;

  // Elite status (0-100)
  const eliteStatus = ['elite', 'concierge'].includes(profile.plan) ? 100 : 0;

  const factors: VisibilityFactors = {
    profileCompleteness,
    verification,
    recentActivity,
    responseRate,
    photoQuality,
    premiumStatus,
    eliteStatus,
  };

  const score = Math.round(
    factors.profileCompleteness * VISIBILITY_WEIGHTS.profileCompleteness +
    factors.verification * VISIBILITY_WEIGHTS.verification +
    factors.recentActivity * VISIBILITY_WEIGHTS.recentActivity +
    factors.responseRate * VISIBILITY_WEIGHTS.responseRate +
    factors.photoQuality * VISIBILITY_WEIGHTS.photoQuality +
    factors.premiumStatus * VISIBILITY_WEIGHTS.premiumStatus +
    factors.eliteStatus * VISIBILITY_WEIGHTS.eliteStatus
  );

  return { score: Math.min(100, Math.max(0, score)), factors };
}
