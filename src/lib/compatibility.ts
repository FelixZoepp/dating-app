import type { Profile, Values } from '@/types';

interface CompatibilityResult {
  score: number;
  topSharedValues: string[];
}

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

export function calculateCompatibility(
  userA: Profile,
  userB: Profile,
  valuesA: Values | null,
  valuesB: Values | null
): CompatibilityResult {
  let totalScore = 0;
  let maxScore = 0;

  // Relationship goal match (weight: 25)
  maxScore += 25;
  if (userA.relationship_goal && userB.relationship_goal) {
    if (userA.relationship_goal === userB.relationship_goal) {
      totalScore += 25;
    } else if (
      (userA.relationship_goal === 'serious' && userB.relationship_goal === 'marriage') ||
      (userA.relationship_goal === 'marriage' && userB.relationship_goal === 'serious') ||
      (userA.relationship_goal === 'marriage' && userB.relationship_goal === 'family') ||
      (userA.relationship_goal === 'family' && userB.relationship_goal === 'marriage')
    ) {
      totalScore += 18;
    } else if (userA.relationship_goal === 'open' || userB.relationship_goal === 'open') {
      totalScore += 10;
    }
  }

  // Children wish (weight: 20)
  maxScore += 20;
  if (userA.children_wish && userB.children_wish) {
    if (userA.children_wish === userB.children_wish) {
      totalScore += 20;
    } else if (
      (userA.children_wish === 'yes' && userB.children_wish === 'maybe') ||
      (userA.children_wish === 'maybe' && userB.children_wish === 'yes')
    ) {
      totalScore += 14;
    } else if (userA.children_wish === 'maybe' || userB.children_wish === 'maybe') {
      totalScore += 8;
    }
  }

  // City match (weight: 10)
  maxScore += 10;
  if (userA.city && userB.city) {
    if (userA.city.toLowerCase() === userB.city.toLowerCase()) {
      totalScore += 10;
    } else if (userA.relocation !== 'no' || userB.relocation !== 'no') {
      totalScore += 4;
    }
  }

  // Career focus compatibility (weight: 10)
  maxScore += 10;
  if (userA.career_focus && userB.career_focus) {
    const levels = { low: 1, medium: 2, high: 3 };
    const diff = Math.abs(levels[userA.career_focus] - levels[userB.career_focus]);
    totalScore += diff === 0 ? 10 : diff === 1 ? 6 : 2;
  }

  // Family orientation (weight: 10)
  maxScore += 10;
  if (userA.family_orientation && userB.family_orientation) {
    const levels = { low: 1, medium: 2, high: 3 };
    const diff = Math.abs(levels[userA.family_orientation] - levels[userB.family_orientation]);
    totalScore += diff === 0 ? 10 : diff === 1 ? 6 : 2;
  }

  // Relationship model (weight: 10)
  maxScore += 10;
  if (userA.relationship_model && userB.relationship_model) {
    if (userA.relationship_model === userB.relationship_model) {
      totalScore += 10;
    } else if (userA.relationship_model === 'flexible' || userB.relationship_model === 'flexible' ||
               userA.relationship_model === 'undecided' || userB.relationship_model === 'undecided') {
      totalScore += 6;
    }
  }

  // Values comparison (weight: 15)
  const topSharedValues: string[] = [];
  maxScore += 15;
  if (valuesA && valuesB) {
    const valueKeys = Object.keys(VALUE_LABELS) as (keyof Values)[];
    let valueDiffSum = 0;
    const similarities: { key: string; diff: number }[] = [];

    for (const key of valueKeys) {
      const a = valuesA[key] as number;
      const b = valuesB[key] as number;
      const diff = Math.abs(a - b);
      valueDiffSum += diff;
      similarities.push({ key, diff });
    }

    similarities.sort((a, b) => a.diff - b.diff);
    for (let i = 0; i < 3 && i < similarities.length; i++) {
      topSharedValues.push(VALUE_LABELS[similarities[i].key]);
    }

    const maxDiff = 4 * valueKeys.length; // max diff per value is 4 (5-1)
    const valueScore = Math.max(0, 1 - valueDiffSum / maxDiff);
    totalScore += Math.round(valueScore * 15);
  }

  const finalScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  return {
    score: Math.min(99, Math.max(15, finalScore)),
    topSharedValues: topSharedValues.length > 0 ? topSharedValues : ['Ambition', 'Kommunikation', 'Loyalität'],
  };
}
