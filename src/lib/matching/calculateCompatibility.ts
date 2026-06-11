import type { Profile, Values, CompatibilityResult, CategoryScores } from '@/types';

const VALUE_LABELS: Record<string, string> = {
  loyalty: 'Loyalität',
  ambition: 'Ambition',
  family: 'Familie',
  freedom: 'Freiheit',
  security: 'Sicherheit',
  spirituality: 'Spiritualität',
  adventure: 'Abenteuer',
  structure: 'Struktur',
  communication: 'Kommunikation',
  status_lifestyle: 'Lifestyle',
};

// Weights for each category (must sum to 100)
const WEIGHTS = {
  relationshipGoal: 20,
  childrenWish: 15,
  lifeModel: 15,
  values: 20,
  familyOrientation: 10,
  ambition: 10,
  lifestyle: 5,
  location: 5,
};

/**
 * Scores relationship goal compatibility (0-100).
 * Considers natural pairings, not just exact matches.
 */
function scoreRelationshipGoal(a: string | null, b: string | null): { score: number; strength: string | null; risk: string | null } {
  if (!a || !b) return { score: 50, strength: null, risk: null };

  const matrix: Record<string, Record<string, number>> = {
    serious: { serious: 100, marriage: 85, family: 75, open: 40 },
    marriage: { serious: 85, marriage: 100, family: 90, open: 30 },
    family: { serious: 75, marriage: 90, family: 100, open: 25 },
    open: { serious: 40, marriage: 30, family: 25, open: 70 },
  };

  const score = matrix[a]?.[b] ?? 50;

  let strength: string | null = null;
  let risk: string | null = null;

  if (score >= 85) {
    strength = 'Ihr habt sehr ähnliche Beziehungsziele';
  } else if (score <= 40) {
    risk = 'Eure Beziehungsziele könnten langfristig zu Konflikten führen';
  }

  return { score, strength, risk };
}

/**
 * Scores children wish compatibility (0-100).
 */
function scoreChildrenWish(a: string | null, b: string | null): { score: number; strength: string | null; risk: string | null } {
  if (!a || !b) return { score: 50, strength: null, risk: null };

  const matrix: Record<string, Record<string, number>> = {
    yes: { yes: 100, maybe: 70, already_have: 80, no: 15 },
    no: { yes: 15, maybe: 40, already_have: 30, no: 100 },
    maybe: { yes: 70, maybe: 75, already_have: 60, no: 40 },
    already_have: { yes: 80, maybe: 60, already_have: 85, no: 30 },
  };

  const score = matrix[a]?.[b] ?? 50;

  let strength: string | null = null;
  let risk: string | null = null;

  if (a === 'yes' && b === 'yes') strength = 'Ihr teilt den Wunsch nach Kindern';
  if ((a === 'yes' && b === 'no') || (a === 'no' && b === 'yes')) risk = 'Unterschiedliche Vorstellungen zum Kinderwunsch';

  return { score, strength, risk };
}

/**
 * Scores life model compatibility (0-100).
 * Considers relationship model, relocation, travel.
 * Allows for complementarity.
 */
function scoreLifeModel(a: Profile, b: Profile): { score: number; strength: string | null; risk: string | null } {
  let total = 0;
  let max = 0;

  // Relationship model (weight 50 of this category)
  max += 50;
  if (a.relationship_model && b.relationship_model) {
    const modelMatrix: Record<string, Record<string, number>> = {
      both_career: { both_career: 90, traditional: 40, flexible: 75, undecided: 65 },
      traditional: { both_career: 40, traditional: 95, flexible: 70, undecided: 60 },
      flexible: { both_career: 75, traditional: 70, flexible: 85, undecided: 75 },
      undecided: { both_career: 65, traditional: 60, flexible: 75, undecided: 70 },
    };
    total += (modelMatrix[a.relationship_model]?.[b.relationship_model] ?? 50) * 0.5;
  } else {
    total += 25;
  }

  // Relocation (weight 25)
  max += 25;
  if (a.relocation && b.relocation) {
    if (a.city === b.city) {
      total += 25; // Same city, relocation doesn't matter
    } else if (a.relocation === 'no' && b.relocation === 'no') {
      total += 5; // Different cities, neither moves
    } else if (a.relocation !== 'no' || b.relocation !== 'no') {
      total += 18; // At least one is open
    }
  } else {
    total += 12;
  }

  // Travel frequency (weight 25)
  max += 25;
  if (a.travel_frequency && b.travel_frequency) {
    const travelLevels = { rarely: 1, monthly: 2, frequently: 3 };
    const diff = Math.abs(travelLevels[a.travel_frequency] - travelLevels[b.travel_frequency]);
    total += diff === 0 ? 25 : diff === 1 ? 18 : 10;
  } else {
    total += 12;
  }

  const score = Math.round((total / max) * 100);

  let strength: string | null = null;
  let risk: string | null = null;

  if (a.relationship_model === b.relationship_model && a.relationship_model) {
    strength = 'Ihr habt die gleiche Vorstellung von Rollenverteilung';
  }

  // Complementarity check: traditional man + family_oriented woman is actually great
  if (
    (a.relationship_model === 'traditional' && b.family_orientation === 'high') ||
    (b.relationship_model === 'traditional' && a.family_orientation === 'high')
  ) {
    strength = 'Eure Lebensmodelle ergänzen sich gut';
  }

  if (a.city !== b.city && a.relocation === 'no' && b.relocation === 'no') {
    risk = 'Ihr lebt in verschiedenen Städten und beide wollen nicht umziehen';
  }

  return { score, strength, risk };
}

/**
 * Scores value compatibility (0-100).
 * Not just equality - considers complementarity.
 */
function scoreValues(a: Values | null, b: Values | null): { score: number; topShared: string[]; strength: string | null; risk: string | null } {
  if (!a || !b) return { score: 50, topShared: [], strength: null, risk: null };

  const valueKeys = Object.keys(VALUE_LABELS) as (keyof typeof VALUE_LABELS)[];
  let totalScore = 0;
  const similarities: { key: string; diff: number; avg: number }[] = [];

  for (const key of valueKeys) {
    const va = (a as unknown as Record<string, number>)[key] ?? 3;
    const vb = (b as unknown as Record<string, number>)[key] ?? 3;
    const diff = Math.abs(va - vb);
    const avg = (va + vb) / 2;

    // Base similarity score (closer = better)
    let keyScore = Math.max(0, 100 - diff * 25);

    // Complementarity bonus: high ambition + high family can complement each other
    if (key === 'ambition' || key === 'family') {
      // If one is high ambition and the other is high family, that's complementary
      if (diff <= 2) keyScore = Math.max(keyScore, 70);
    }

    // Both high on communication is especially good
    if (key === 'communication' && va >= 4 && vb >= 4) {
      keyScore = Math.min(100, keyScore + 15);
    }

    // Large gap on loyalty is a big risk
    if (key === 'loyalty' && diff >= 3) {
      keyScore = Math.max(0, keyScore - 20);
    }

    totalScore += keyScore;
    similarities.push({ key, diff, avg });
  }

  const score = Math.round(totalScore / valueKeys.length);

  // Top shared values: lowest diff, highest average
  similarities.sort((x, y) => x.diff - y.diff || y.avg - x.avg);
  const topShared = similarities.slice(0, 3).map((s) => VALUE_LABELS[s.key]);

  let strength: string | null = null;
  let risk: string | null = null;

  // Find strongest shared value
  if (similarities[0] && similarities[0].diff === 0 && similarities[0].avg >= 4) {
    strength = `Ihr teilt besonders stark den Wert "${VALUE_LABELS[similarities[0].key]}"`;
  }

  // Find biggest conflict
  const worstValue = similarities[similarities.length - 1];
  if (worstValue && worstValue.diff >= 3) {
    risk = `Deutlich unterschiedliche Einstellungen bei "${VALUE_LABELS[worstValue.key]}"`;
  }

  return { score, topShared, strength, risk };
}

/**
 * Scores family orientation compatibility (0-100).
 * Complementarity matters: high career + high family can work.
 */
function scoreFamilyOrientation(a: Profile, b: Profile): { score: number; strength: string | null; risk: string | null } {
  if (!a.family_orientation || !b.family_orientation) return { score: 50, strength: null, risk: null };

  const levels = { low: 1, medium: 2, high: 3 };
  const la = levels[a.family_orientation];
  const lb = levels[b.family_orientation];
  const diff = Math.abs(la - lb);

  // Similar family orientation is great
  let score = diff === 0 ? 95 : diff === 1 ? 70 : 35;

  // Complementarity: entrepreneur man (high career, medium family) + family-oriented woman
  const isEntrepreneurType = (type: string | null) =>
    type !== null && ['entrepreneur', 'self_employed', 'ceo', 'investor'].includes(type);

  if (isEntrepreneurType(a.account_type) && b.family_orientation === 'high' && a.family_orientation === 'medium') {
    score = Math.max(score, 80); // This is actually a common good pairing
  }
  if (isEntrepreneurType(b.account_type) && a.family_orientation === 'high' && b.family_orientation === 'medium') {
    score = Math.max(score, 80);
  }

  let strength: string | null = null;
  let risk: string | null = null;

  if (la >= 2 && lb >= 2) strength = 'Ihr legt beide Wert auf Familie';
  if ((la === 1 && lb === 3) || (la === 3 && lb === 1)) risk = 'Sehr unterschiedliche Familienorientierung';

  return { score, strength, risk };
}

/**
 * Scores career/ambition compatibility (0-100).
 * Two highly ambitious people can work but also have conflict potential.
 */
function scoreAmbition(a: Profile, b: Profile): { score: number; strength: string | null; risk: string | null } {
  if (!a.career_focus || !b.career_focus) return { score: 50, strength: null, risk: null };

  const levels = { low: 1, medium: 2, high: 3 };
  const la = levels[a.career_focus];
  const lb = levels[b.career_focus];
  const diff = Math.abs(la - lb);

  let score: number;

  if (diff === 0) {
    // Same level - good but two high-career can have issues
    score = la === 3 ? 80 : 90; // Slightly less for both high due to time conflict potential
  } else if (diff === 1) {
    score = 75; // One step apart is fine, often complementary
  } else {
    score = 40; // Very different career focus can be challenging
  }

  // Complementary: high career + medium career often works very well
  if ((la === 3 && lb === 2) || (la === 2 && lb === 3)) {
    score = 85;
  }

  let strength: string | null = null;
  let risk: string | null = null;

  if (la >= 2 && lb >= 2) strength = 'Ihr seid beide ambitioniert';
  if (la === 3 && lb === 3) risk = 'Beide sehr karrierefokussiert – achtet auf gemeinsame Zeit';
  if (diff === 2) risk = 'Unterschiedliche Karriereprioritäten';

  return { score, strength, risk };
}

/**
 * Scores lifestyle compatibility (0-100).
 * Based on travel frequency and general lifestyle indicators.
 */
function scoreLifestyle(a: Profile, b: Profile): { score: number; strength: string | null; risk: string | null } {
  let total = 0;

  // Travel compatibility
  if (a.travel_frequency && b.travel_frequency) {
    const travelLevels = { rarely: 1, monthly: 2, frequently: 3 };
    const diff = Math.abs(travelLevels[a.travel_frequency] - travelLevels[b.travel_frequency]);
    total += diff === 0 ? 100 : diff === 1 ? 70 : 35;
  } else {
    total += 50;
  }

  const score = total;

  let strength: string | null = null;
  let risk: string | null = null;

  if (a.travel_frequency === b.travel_frequency && a.travel_frequency === 'frequently') {
    strength = 'Ihr reist beide gerne und häufig';
  }
  if (
    (a.travel_frequency === 'frequently' && b.travel_frequency === 'rarely') ||
    (a.travel_frequency === 'rarely' && b.travel_frequency === 'frequently')
  ) {
    risk = 'Unterschiedliche Vorstellungen zur Reisehäufigkeit';
  }

  return { score, strength, risk };
}

/**
 * Scores location compatibility (0-100).
 */
function scoreLocation(a: Profile, b: Profile): { score: number; strength: string | null; risk: string | null } {
  if (!a.city || !b.city) return { score: 50, strength: null, risk: null };

  const sameCity = a.city.toLowerCase().trim() === b.city.toLowerCase().trim();

  if (sameCity) {
    return { score: 100, strength: `Ihr lebt beide in ${a.city}`, risk: null };
  }

  // Different city - check relocation willingness
  const aOpen = a.relocation !== 'no';
  const bOpen = b.relocation !== 'no';

  if (aOpen && bOpen) {
    return { score: 65, strength: null, risk: null };
  }
  if (aOpen || bOpen) {
    return { score: 45, strength: null, risk: 'Verschiedene Städte, aber einer ist umzugsbereit' };
  }

  return {
    score: 15,
    strength: null,
    risk: `Ihr lebt in verschiedenen Städten (${a.city} / ${b.city}) und wollt nicht umziehen`,
  };
}

/**
 * Main compatibility calculation.
 * Returns a detailed result with category scores, strengths, risks, and explanation.
 */
export function calculateCompatibility(
  userA: Profile,
  userB: Profile,
  valuesA: Values | null,
  valuesB: Values | null
): CompatibilityResult {
  const rg = scoreRelationshipGoal(userA.relationship_goal, userB.relationship_goal);
  const cw = scoreChildrenWish(userA.children_wish, userB.children_wish);
  const lm = scoreLifeModel(userA, userB);
  const val = scoreValues(valuesA, valuesB);
  const fo = scoreFamilyOrientation(userA, userB);
  const amb = scoreAmbition(userA, userB);
  const ls = scoreLifestyle(userA, userB);
  const loc = scoreLocation(userA, userB);

  const categoryScores: CategoryScores = {
    relationshipGoal: rg.score,
    childrenWish: cw.score,
    lifeModel: lm.score,
    values: val.score,
    familyOrientation: fo.score,
    ambition: amb.score,
    lifestyle: ls.score,
    location: loc.score,
  };

  // Weighted total
  const totalScore = Math.round(
    (rg.score * WEIGHTS.relationshipGoal +
      cw.score * WEIGHTS.childrenWish +
      lm.score * WEIGHTS.lifeModel +
      val.score * WEIGHTS.values +
      fo.score * WEIGHTS.familyOrientation +
      amb.score * WEIGHTS.ambition +
      ls.score * WEIGHTS.lifestyle +
      loc.score * WEIGHTS.location) / 100
  );

  // Collect strengths and risks
  const strengths: string[] = [];
  const risks: string[] = [];

  for (const result of [rg, cw, lm, val, fo, amb, ls, loc]) {
    if (result.strength) strengths.push(result.strength);
    if (result.risk) risks.push(result.risk);
  }

  // Generate explanation
  let explanation: string;
  if (totalScore >= 85) {
    explanation = 'Hervorragende Kompatibilität! Eure Lebensziele, Werte und Vorstellungen passen sehr gut zusammen.';
  } else if (totalScore >= 70) {
    explanation = 'Gute Kompatibilität. Ihr teilt wichtige Werte und Lebensziele mit Raum für gegenseitiges Wachstum.';
  } else if (totalScore >= 55) {
    explanation = 'Moderate Kompatibilität. Es gibt gemeinsame Basis, aber auch Bereiche die Kompromisse erfordern.';
  } else {
    explanation = 'Einige Unterschiede in wichtigen Lebensbereichen. Ein offenes Gespräch darüber wäre empfehlenswert.';
  }

  return {
    totalScore: Math.min(99, Math.max(10, totalScore)),
    categoryScores,
    strengths: strengths.slice(0, 4),
    risks: risks.slice(0, 3),
    explanation,
    topSharedValues: val.topShared.length > 0 ? val.topShared : ['Ambition', 'Kommunikation', 'Loyalität'],
  };
}
