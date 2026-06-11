export type Gender = 'male' | 'female' | 'other';
export type AccountType =
  | 'entrepreneur' | 'self_employed' | 'ceo' | 'investor'
  | 'ambitious_woman' | 'businesswoman' | 'career_woman' | 'student' | 'family_oriented';
export type RelationshipGoal = 'serious' | 'marriage' | 'family' | 'open';
export type ChildrenWish = 'yes' | 'no' | 'maybe' | 'already_have';
export type CareerFocus = 'low' | 'medium' | 'high';
export type FamilyOrientation = 'low' | 'medium' | 'high';
export type RelationshipModel = 'both_career' | 'traditional' | 'flexible' | 'undecided';
export type Relocation = 'yes' | 'no' | 'maybe';
export type TravelFrequency = 'rarely' | 'monthly' | 'frequently';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type PlanType = 'basic' | 'premium' | 'elite' | 'concierge' | 'founder_pass';
export type RevenueRange = 'under_100k' | '100k_500k' | '500k_1m' | 'over_1m';

export interface Profile {
  id: string;
  created_at: string;
  email: string;
  first_name: string | null;
  age: number | null;
  city: string | null;
  gender: Gender | null;
  seeking_gender: Gender | null;
  account_type: AccountType | null;
  relationship_goal: RelationshipGoal | null;
  children_wish: ChildrenWish | null;
  career_focus: CareerFocus | null;
  family_orientation: FamilyOrientation | null;
  relationship_model: RelationshipModel | null;
  relocation: Relocation | null;
  travel_frequency: TravelFrequency | null;
  bio: string | null;
  life_in_5_years: string | null;
  looking_for: string | null;
  unique_trait: string | null;
  profile_image_url: string | null;
  gallery_image_urls: string[] | null;
  verification_status: VerificationStatus;
  is_admin: boolean;
  is_banned: boolean;
  plan: PlanType;
  onboarding_completed: boolean;
}

export interface Values {
  profile_id: string;
  loyalty: number;
  ambition: number;
  family: number;
  freedom: number;
  security: number;
  spirituality: number;
  adventure: number;
  structure: number;
  communication: number;
  status_lifestyle: number;
}

export interface BusinessVerification {
  id: string;
  profile_id: string;
  company_name: string | null;
  website: string | null;
  linkedin: string | null;
  registry_link: string | null;
  revenue_range: RevenueRange | null;
  status: VerificationStatus;
  admin_notes: string | null;
}

export interface Like {
  id: string;
  from_profile_id: string;
  to_profile_id: string;
  created_at: string;
}

export interface Match {
  id: string;
  profile_a: string;
  profile_b: string;
  created_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface ConciergeApplication {
  id: string;
  profile_id: string;
  motivation: string | null;
  budget: string | null;
  expectations: string | null;
  created_at: string;
  status: string;
}

export interface MatchWithProfile extends Match {
  partner: Profile;
}

export interface ProfileWithValues extends Profile {
  values: Values | null;
}

export interface MatchCandidate extends Profile {
  values: Values | null;
  compatibility_score: number;
  top_shared_values: string[];
}

// ━━━ Matching & Monetization Types ━━━

export interface CategoryScores {
  relationshipGoal: number;
  childrenWish: number;
  lifeModel: number;
  values: number;
  familyOrientation: number;
  ambition: number;
  lifestyle: number;
  location: number;
}

export interface CompatibilityResult {
  totalScore: number;
  categoryScores: CategoryScores;
  strengths: string[];
  risks: string[];
  explanation: string;
  topSharedValues: string[];
}

export interface MatchRecommendation {
  profile: Profile;
  values: Values | null;
  compatibility: CompatibilityResult;
  visibilityScore: number;
  finalRank: number;
}

export type UserSegment =
  | 'new_user'
  | 'onboarding_incomplete'
  | 'trial_active'
  | 'trial_ending'
  | 'free_high_intent'
  | 'founder_pass_active'
  | 'premium_user'
  | 'elite_user'
  | 'concierge_candidate'
  | 'inactive_user'
  | 'high_quality_free_user'
  | 'low_quality_profile'
  | 'needs_verification';

export interface Offer {
  id: string;
  type: 'trial_info' | 'trial_ending' | 'founder_pass' | 'premium' | 'elite' | 'concierge' | 'comeback';
  headline: string;
  description: string;
  price: string | null;
  ctaText: string;
  ctaLink: string;
  priority: number;
}

export interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_name: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type AnalyticsEventName =
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'report_viewed'
  | 'match_viewed'
  | 'compatibility_details_clicked'
  | 'like_sent'
  | 'like_received'
  | 'match_created'
  | 'message_sent'
  | 'paywall_viewed'
  | 'trial_started'
  | 'trial_ended'
  | 'founder_pass_clicked'
  | 'founder_pass_purchased'
  | 'premium_clicked'
  | 'premium_purchased'
  | 'elite_clicked'
  | 'elite_purchased'
  | 'concierge_application_started'
  | 'concierge_application_submitted';

export interface PaywallTrigger {
  type: 'who_liked' | 'high_match_details' | 'trial_end' | 'founder_pass_offer' | 'elite_offer' | 'concierge_offer';
  show: boolean;
  offer: Offer | null;
}

export interface ExtendedProfile extends Profile {
  last_active_at: string | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  response_rate: number;
  total_likes_received: number;
  total_likes_sent: number;
  total_messages_sent: number;
  is_flagged: boolean;
}
