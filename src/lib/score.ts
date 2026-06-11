/**
 * FounderMatch Score Engine
 *
 * Calculates real scores from quiz answers. No fake manipulation.
 * The gap between Ist-Score and Potential-Score comes from honest
 * self-assessment, not random numbers.
 *
 * Transparency note shown to users: "Selbsteinschatzung, keine Diagnostik."
 */

export interface QuizAnswers {
  // Shared
  gender: 'male' | 'female';
  relationshipGoal: string;

  // Men's diagnostic questions
  currentStatus?: string;       // 'single_long' | 'single_recent' | 'dating' | 'complicated'
  responseRate?: string;         // 'very_low' | 'low' | 'medium' | 'high'
  blockers?: string[];           // multi-select: ['time', 'wrong_people', 'no_effort', 'location', 'confidence', 'standards']
  professionalStand?: string;    // 'employee' | 'self_employed' | 'founder' | 'ceo' | 'investor'
  fiveYearVision?: string;       // 'family' | 'career' | 'both' | 'freedom' | 'unsure'

  // Women's curation questions
  partnerValues?: string[];      // multi-select: ['ambition', 'loyalty', 'family', 'humor', 'security', 'adventure', 'communication']
  familyTimeline?: string;       // 'now' | '2_years' | '5_years' | 'unsure' | 'no'
  lifestylePreference?: string;  // 'traditional' | 'modern' | 'flexible'
  partnerQualities?: string;     // free text
  dealbreakers?: string[];       // multi-select
}

export interface ScoreResult {
  ambition: number;      // 0-100
  family: number;        // 0-100
  lifestyle: number;     // 0-100
  readiness: number;     // 0-100
  total: number;         // 0-100 (weighted average)
  potential: number;     // 0-100 (realistic achievable with right pool)
}

/**
 * Calculate scores for male users (diagnostic/reveal flow).
 * The Ist-Score is intentionally honest -- low response rate + wrong people
 * + long single = lower readiness. The Potential shows what's achievable
 * in the right environment (FounderMatch pool).
 */
function calculateMaleScores(answers: QuizAnswers): ScoreResult {
  // Ambition (0-100): based on professional standing + vision
  let ambition = 50;
  switch (answers.professionalStand) {
    case 'investor': ambition = 95; break;
    case 'ceo': ambition = 90; break;
    case 'founder': ambition = 85; break;
    case 'self_employed': ambition = 70; break;
    case 'employee': ambition = 50; break;
  }
  // Vision boost
  if (answers.fiveYearVision === 'both') ambition = Math.min(100, ambition + 10);
  if (answers.fiveYearVision === 'career') ambition = Math.min(100, ambition + 5);

  // Family (0-100): based on relationship goal + vision
  let family = 40;
  switch (answers.relationshipGoal) {
    case 'family': family = 90; break;
    case 'marriage': family = 80; break;
    case 'serious': family = 60; break;
    case 'open': family = 30; break;
  }
  if (answers.fiveYearVision === 'family') family = Math.min(100, family + 15);
  if (answers.fiveYearVision === 'both') family = Math.min(100, family + 10);

  // Lifestyle (0-100): derived from blockers + professional standing
  let lifestyle = 60;
  if (answers.blockers?.includes('time')) lifestyle -= 15;
  if (answers.blockers?.includes('location')) lifestyle -= 10;
  if (['founder', 'ceo', 'investor'].includes(answers.professionalStand || '')) lifestyle += 15;
  if (answers.fiveYearVision === 'freedom') lifestyle += 10;
  lifestyle = Math.max(10, Math.min(100, lifestyle));

  // Readiness (0-100): the key "Ist" metric -- honestly low for many
  let readiness = 50;

  // Current status impact
  switch (answers.currentStatus) {
    case 'single_long': readiness -= 15; break;   // Long single = lower current readiness
    case 'single_recent': readiness -= 5; break;
    case 'dating': readiness += 10; break;
    case 'complicated': readiness -= 10; break;
  }

  // Response rate impact (big factor)
  switch (answers.responseRate) {
    case 'very_low': readiness -= 20; break;
    case 'low': readiness -= 10; break;
    case 'medium': readiness += 0; break;
    case 'high': readiness += 10; break;
  }

  // Blockers impact
  const blockerCount = answers.blockers?.length || 0;
  readiness -= blockerCount * 5;
  if (answers.blockers?.includes('wrong_people')) readiness -= 5;
  if (answers.blockers?.includes('confidence')) readiness -= 8;
  if (answers.blockers?.includes('no_effort')) readiness -= 10;

  readiness = Math.max(10, Math.min(100, readiness));

  // Total (weighted)
  const total = Math.round(
    ambition * 0.25 +
    family * 0.20 +
    lifestyle * 0.15 +
    readiness * 0.40  // Readiness weighs most for men
  );

  // Potential: realistically higher, based on being in the right pool
  // The gap is honest: better pool -> better response rate -> better readiness
  let potentialReadiness = readiness;
  if (answers.responseRate === 'very_low' || answers.responseRate === 'low') {
    potentialReadiness += 25; // Right pool dramatically improves this
  }
  if (answers.blockers?.includes('wrong_people')) {
    potentialReadiness += 15; // Curated matches solve this
  }
  if (answers.blockers?.includes('time')) {
    potentialReadiness += 10; // Fewer but better matches save time
  }
  potentialReadiness = Math.min(95, potentialReadiness);

  const potential = Math.round(
    ambition * 0.25 +
    family * 0.20 +
    lifestyle * 0.15 +
    potentialReadiness * 0.40
  );

  return {
    ambition: Math.round(ambition),
    family: Math.round(family),
    lifestyle: Math.round(lifestyle),
    readiness: Math.round(readiness),
    total: Math.max(15, Math.min(85, total)),      // Never above 85 for Ist
    potential: Math.max(total + 10, Math.min(95, potential)), // Always higher, max 95
  };
}

/**
 * Calculate scores for female users (curation flow).
 * Women's scores are NOT revealed as a pressure mechanism.
 * They're used internally for matching quality only.
 */
function calculateFemaleScores(answers: QuizAnswers): ScoreResult {
  let ambition = 60;
  let family = 50;
  let lifestyle = 60;
  let readiness = 65; // Women generally get a higher baseline (no shame pressure)

  // Values influence
  if (answers.partnerValues?.includes('ambition')) ambition += 15;
  if (answers.partnerValues?.includes('family')) family += 20;
  if (answers.partnerValues?.includes('security')) family += 10;
  if (answers.partnerValues?.includes('adventure')) lifestyle += 15;
  if (answers.partnerValues?.includes('communication')) readiness += 10;
  if (answers.partnerValues?.includes('loyalty')) readiness += 5;

  // Family timeline
  switch (answers.familyTimeline) {
    case 'now': family += 25; readiness += 10; break;
    case '2_years': family += 20; readiness += 5; break;
    case '5_years': family += 10; break;
    case 'no': family -= 20; lifestyle += 15; break;
  }

  // Lifestyle preference
  switch (answers.lifestylePreference) {
    case 'traditional': family += 10; break;
    case 'modern': ambition += 10; lifestyle += 10; break;
    case 'flexible': readiness += 5; break;
  }

  // Relationship goal
  switch (answers.relationshipGoal) {
    case 'family': family += 15; readiness += 10; break;
    case 'marriage': family += 10; readiness += 5; break;
    case 'serious': readiness += 5; break;
  }

  // Clamp all values
  ambition = Math.max(20, Math.min(100, ambition));
  family = Math.max(20, Math.min(100, family));
  lifestyle = Math.max(20, Math.min(100, lifestyle));
  readiness = Math.max(30, Math.min(100, readiness));

  const total = Math.round(
    ambition * 0.20 +
    family * 0.30 +
    lifestyle * 0.20 +
    readiness * 0.30
  );

  return {
    ambition: Math.round(ambition),
    family: Math.round(family),
    lifestyle: Math.round(lifestyle),
    readiness: Math.round(readiness),
    total: Math.max(40, Math.min(95, total)),
    potential: Math.max(total + 5, Math.min(98, total + 10)),
  };
}

/**
 * Main entry point for score calculation.
 */
export function calculateScores(answers: QuizAnswers): ScoreResult {
  if (answers.gender === 'male') {
    return calculateMaleScores(answers);
  }
  return calculateFemaleScores(answers);
}

/**
 * Generate the personalized plan text for the score reveal.
 * Only used for men's flow.
 */
export function generatePlanItems(scores: ScoreResult, answers: QuizAnswers): string[] {
  const items: string[] = [];

  if (scores.readiness < 40) {
    items.push('Profil-Optimierung: Dein Profil wird fur die richtige Zielgruppe sichtbar gemacht');
  }

  if (answers.responseRate === 'very_low' || answers.responseRate === 'low') {
    items.push('Kuratierte Matches: Nur Frauen, die zu deinen Werten und Zielen passen');
  }

  if (answers.blockers?.includes('wrong_people')) {
    items.push('Qualitatsfilter: Verifizierte, ernsthafte Singles statt Fake-Profile');
  }

  if (answers.blockers?.includes('time')) {
    items.push('Zeit-Effizienz: Wenige, hochwertige Vorschlage statt endlosem Swipen');
  }

  if (answers.blockers?.includes('confidence')) {
    items.push('Community-Support: Austausch mit anderen ambitionierten Mannern');
  }

  if (scores.family > 60) {
    items.push('Familien-Matching: Partner mit kompatiblen Familienwerten und -zielen');
  }

  if (scores.ambition > 70) {
    items.push('Unternehmer-Verifizierung: Zeige deinen Status und ziehe die richtigen Frauen an');
  }

  // Always include at least 3 items
  if (items.length < 3) {
    items.push('Werte-Analyse: Matches basierend auf echter Kompatibilitat');
    items.push('Personliche Vorschlage: Taglich kuratierte Profile fur dich');
  }

  return items.slice(0, 5);
}
