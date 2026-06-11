'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import type { AccountType, RelationshipGoal, ChildrenWish, CareerFocus, FamilyOrientation, RelationshipModel, Relocation, TravelFrequency, RevenueRange } from '@/types';
import { Crown, ArrowRight, ArrowLeft, Check } from 'lucide-react';

const STEPS = [
  'Account-Typ',
  'Basisdaten',
  'Lebensmodell',
  'Werte & Persönlichkeit',
  'Verifizierung',
  'Fotos & Profil',
];

const ACCOUNT_TYPES_MALE: { value: AccountType; label: string }[] = [
  { value: 'entrepreneur', label: 'Unternehmer' },
  { value: 'self_employed', label: 'Selbstständig' },
  { value: 'ceo', label: 'Geschäftsführer' },
  { value: 'investor', label: 'Investor' },
];

const ACCOUNT_TYPES_FEMALE: { value: AccountType; label: string }[] = [
  { value: 'ambitious_woman', label: 'Ambitionierte Frau' },
  { value: 'businesswoman', label: 'Unternehmerin' },
  { value: 'career_woman', label: 'Karrierefrau' },
  { value: 'student', label: 'Studentin' },
  { value: 'family_oriented', label: 'Familienorientiert' },
];

const isEntrepreneurType = (type: AccountType | null) =>
  type !== null && ['entrepreneur', 'self_employed', 'ceo', 'investor'].includes(type);

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  // Step 1
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [accountType, setAccountType] = useState<AccountType | null>(null);

  // Step 2
  const [firstName, setFirstName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [seekingGender, setSeekingGender] = useState('');
  const [relationshipGoal, setRelationshipGoal] = useState('');
  const [childrenWish, setChildrenWish] = useState('');

  // Step 3
  const [careerFocus, setCareerFocus] = useState('');
  const [familyOrientation, setFamilyOrientation] = useState('');
  const [relationshipModel, setRelationshipModel] = useState('');
  const [relocation, setRelocation] = useState('');
  const [travelFrequency, setTravelFrequency] = useState('');

  // Step 4 - Values
  const [values, setValues] = useState({
    loyalty: 3,
    ambition: 3,
    family: 3,
    freedom: 3,
    security: 3,
    spirituality: 3,
    adventure: 3,
    structure: 3,
    communication: 3,
    status_lifestyle: 3,
  });

  // Step 5 - Business verification
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [registryLink, setRegistryLink] = useState('');
  const [revenueRange, setRevenueRange] = useState('');

  // Step 6 - Photos & bio
  const [bio, setBio] = useState('');
  const [lifeIn5Years, setLifeIn5Years] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [uniqueTrait, setUniqueTrait] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const effectiveSteps = isEntrepreneurType(accountType)
    ? STEPS
    : STEPS.filter((s) => s !== 'Verifizierung');

  const currentStepName = effectiveSteps[step];
  const totalSteps = effectiveSteps.length;
  const progress = ((step + 1) / totalSteps) * 100;

  async function handleComplete() {
    if (!userId) return;
    setLoading(true);

    const supabase = createClient();

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        age: parseInt(age),
        city,
        gender,
        seeking_gender: seekingGender,
        account_type: accountType,
        relationship_goal: relationshipGoal as RelationshipGoal,
        children_wish: childrenWish as ChildrenWish,
        career_focus: careerFocus as CareerFocus,
        family_orientation: familyOrientation as FamilyOrientation,
        relationship_model: relationshipModel as RelationshipModel,
        relocation: relocation as Relocation,
        travel_frequency: travelFrequency as TravelFrequency,
        bio,
        life_in_5_years: lifeIn5Years,
        looking_for: lookingFor,
        unique_trait: uniqueTrait,
        onboarding_completed: true,
        verification_status: isEntrepreneurType(accountType) ? 'pending' : 'verified',
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Profile update error:', profileError);
      setLoading(false);
      return;
    }

    // Upsert values
    await supabase.from('values').upsert({
      profile_id: userId,
      ...values,
    });

    // Business verification if entrepreneur
    if (isEntrepreneurType(accountType)) {
      await supabase.from('business_verifications').insert({
        profile_id: userId,
        company_name: companyName || null,
        website: website || null,
        linkedin: linkedin || null,
        registry_link: registryLink || null,
        revenue_range: (revenueRange as RevenueRange) || null,
        status: 'pending',
      });
    }

    router.push('/dashboard');
    router.refresh();
  }

  function nextStep() {
    if (step < totalSteps - 1) setStep(step + 1);
    else handleComplete();
  }

  function prevStep() {
    if (step > 0) setStep(step - 1);
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xl font-bold tracking-tight">
              <span className="text-zinc-900">Founder</span>
              <span className="text-amber-600">Match</span>
            </span>
            <span className="text-sm text-zinc-400">
              Schritt {step + 1} von {totalSteps}
            </span>
          </div>
          <div className="w-full bg-zinc-200 rounded-full h-1.5">
            <div
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Step 1: Account Type */}
        {currentStepName === 'Account-Typ' && (
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Was beschreibt dich am besten?</h2>
            <p className="text-zinc-500 mb-8">Wähle zuerst dein Geschlecht, dann deinen Account-Typ.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-3">Geschlecht</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'male' as const, label: 'Mann' },
                    { value: 'female' as const, label: 'Frau' },
                  ].map((g) => (
                    <button
                      key={g.value}
                      onClick={() => { setGender(g.value); setAccountType(null); }}
                      className={`p-4 rounded-xl border-2 text-center font-medium transition-all ${
                        gender === g.value
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {gender && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-3">Account-Typ</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(gender === 'male' ? ACCOUNT_TYPES_MALE : ACCOUNT_TYPES_FEMALE).map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setAccountType(t.value)}
                        className={`p-4 rounded-xl border-2 text-center text-sm font-medium transition-all ${
                          accountType === t.value
                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Basisdaten */}
        {currentStepName === 'Basisdaten' && (
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Erzähl uns von dir</h2>
            <p className="text-zinc-500 mb-8">Grundlegende Informationen für dein Profil.</p>

            <div className="space-y-4">
              <Input id="firstName" label="Vorname" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Dein Vorname" />
              <Input id="age" label="Alter" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="z.B. 32" min="18" max="99" />
              <Input id="city" label="Stadt" value={city} onChange={(e) => setCity(e.target.value)} placeholder="z.B. München" />
              <Select
                id="seekingGender"
                label="Ich suche"
                value={seekingGender}
                onChange={(e) => setSeekingGender(e.target.value)}
                placeholder="Bitte wählen"
                options={[
                  { value: 'male', label: 'Männer' },
                  { value: 'female', label: 'Frauen' },
                  { value: 'other', label: 'Alle' },
                ]}
              />
              <Select
                id="relationshipGoal"
                label="Beziehungsziel"
                value={relationshipGoal}
                onChange={(e) => setRelationshipGoal(e.target.value)}
                placeholder="Bitte wählen"
                options={[
                  { value: 'serious', label: 'Ernsthafte Beziehung' },
                  { value: 'marriage', label: 'Ehe' },
                  { value: 'family', label: 'Familie gründen' },
                  { value: 'open', label: 'Offen' },
                ]}
              />
              <Select
                id="childrenWish"
                label="Kinderwunsch"
                value={childrenWish}
                onChange={(e) => setChildrenWish(e.target.value)}
                placeholder="Bitte wählen"
                options={[
                  { value: 'yes', label: 'Ja' },
                  { value: 'no', label: 'Nein' },
                  { value: 'maybe', label: 'Vielleicht' },
                  { value: 'already_have', label: 'Habe bereits Kinder' },
                ]}
              />
            </div>
          </div>
        )}

        {/* Step 3: Lebensmodell */}
        {currentStepName === 'Lebensmodell' && (
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Dein Lebensmodell</h2>
            <p className="text-zinc-500 mb-8">Wie stellst du dir dein Leben und deine Partnerschaft vor?</p>

            <div className="space-y-4">
              <Select
                id="careerFocus"
                label="Karrierefokus"
                value={careerFocus}
                onChange={(e) => setCareerFocus(e.target.value)}
                placeholder="Bitte wählen"
                options={[
                  { value: 'low', label: 'Niedrig' },
                  { value: 'medium', label: 'Mittel' },
                  { value: 'high', label: 'Hoch' },
                ]}
              />
              <Select
                id="familyOrientation"
                label="Familienorientierung"
                value={familyOrientation}
                onChange={(e) => setFamilyOrientation(e.target.value)}
                placeholder="Bitte wählen"
                options={[
                  { value: 'low', label: 'Niedrig' },
                  { value: 'medium', label: 'Mittel' },
                  { value: 'high', label: 'Hoch' },
                ]}
              />
              <Select
                id="relationshipModel"
                label="Gewünschte Rollenverteilung"
                value={relationshipModel}
                onChange={(e) => setRelationshipModel(e.target.value)}
                placeholder="Bitte wählen"
                options={[
                  { value: 'both_career', label: 'Beide karriereorientiert' },
                  { value: 'traditional', label: 'Klassisches Familienmodell' },
                  { value: 'flexible', label: 'Flexibel' },
                  { value: 'undecided', label: 'Noch offen' },
                ]}
              />
              <Select
                id="relocation"
                label="Umzugsbereitschaft"
                value={relocation}
                onChange={(e) => setRelocation(e.target.value)}
                placeholder="Bitte wählen"
                options={[
                  { value: 'yes', label: 'Ja' },
                  { value: 'no', label: 'Nein' },
                  { value: 'maybe', label: 'Vielleicht' },
                ]}
              />
              <Select
                id="travelFrequency"
                label="Reisefrequenz"
                value={travelFrequency}
                onChange={(e) => setTravelFrequency(e.target.value)}
                placeholder="Bitte wählen"
                options={[
                  { value: 'rarely', label: 'Selten' },
                  { value: 'monthly', label: 'Monatlich' },
                  { value: 'frequently', label: 'Häufig' },
                ]}
              />
            </div>
          </div>
        )}

        {/* Step 4: Werte */}
        {currentStepName === 'Werte & Persönlichkeit' && (
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Deine Werte</h2>
            <p className="text-zinc-500 mb-8">Bewerte auf einer Skala von 1 bis 5, wie wichtig dir diese Werte sind.</p>

            <div className="space-y-6">
              {[
                { key: 'loyalty', label: 'Loyalität' },
                { key: 'ambition', label: 'Ambition' },
                { key: 'family', label: 'Familienwunsch' },
                { key: 'freedom', label: 'Freiheit' },
                { key: 'security', label: 'Sicherheit' },
                { key: 'spirituality', label: 'Spiritualität / Religion' },
                { key: 'adventure', label: 'Abenteuer' },
                { key: 'structure', label: 'Ordnung / Struktur' },
                { key: 'communication', label: 'Kommunikation' },
                { key: 'status_lifestyle', label: 'Status / Lifestyle' },
              ].map((v) => (
                <Slider
                  key={v.key}
                  label={v.label}
                  value={values[v.key as keyof typeof values]}
                  onChange={(val) => setValues((prev) => ({ ...prev, [v.key]: val }))}
                  min={1}
                  max={5}
                  labels={['Unwichtig', '', 'Neutral', '', 'Sehr wichtig']}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Verifizierung (nur Unternehmer) */}
        {currentStepName === 'Verifizierung' && (
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Unternehmer-Verifizierung</h2>
            <p className="text-zinc-500 mb-8">
              Hilf uns, dein Profil zu verifizieren. Diese Daten sind nur für das Admin-Team sichtbar.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Crown className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Warum verifizieren?</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Verifizierte Unternehmer erhalten ein Abzeichen und höhere Sichtbarkeit bei Matches.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Input id="companyName" label="Firmenname" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="z.B. Muster GmbH" />
              <Input id="website" label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="z.B. https://muster.de" />
              <Input id="linkedin" label="LinkedIn Profil" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="z.B. https://linkedin.com/in/..." />
              <Input id="registryLink" label="Handelsregister-Link (optional)" value={registryLink} onChange={(e) => setRegistryLink(e.target.value)} placeholder="Optional" />
              <Select
                id="revenueRange"
                label="Umsatzklasse (optional)"
                value={revenueRange}
                onChange={(e) => setRevenueRange(e.target.value)}
                placeholder="Bitte wählen"
                options={[
                  { value: 'under_100k', label: '< 100.000 €' },
                  { value: '100k_500k', label: '100.000 – 500.000 €' },
                  { value: '500k_1m', label: '500.000 – 1.000.000 €' },
                  { value: 'over_1m', label: '> 1.000.000 €' },
                ]}
              />
            </div>
          </div>
        )}

        {/* Step 6: Fotos & Profil */}
        {currentStepName === 'Fotos & Profil' && (
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Dein Profil</h2>
            <p className="text-zinc-500 mb-8">Zeig dich von deiner besten Seite.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-3">Profilbild</label>
                <div className="w-32 h-32 bg-zinc-100 rounded-2xl border-2 border-dashed border-zinc-300 flex items-center justify-center cursor-pointer hover:border-amber-400 transition-colors">
                  <span className="text-zinc-400 text-sm text-center px-2">Foto Upload<br/>(kommt bald)</span>
                </div>
                <p className="text-xs text-zinc-400 mt-2">Foto-Upload wird über Supabase Storage aktiviert.</p>
              </div>

              <Textarea id="bio" label="Kurzbeschreibung" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Erzähl kurz etwas über dich..." />
              <Textarea id="lifeIn5Years" label="Mein Leben in 5 Jahren" value={lifeIn5Years} onChange={(e) => setLifeIn5Years(e.target.value)} placeholder="Wo siehst du dich in 5 Jahren?" />
              <Textarea id="lookingFor" label="Was ich in einer Beziehung suche" value={lookingFor} onChange={(e) => setLookingFor(e.target.value)} placeholder="Was ist dir in einer Partnerschaft wichtig?" />
              <Textarea id="uniqueTrait" label="Was mich besonders macht" value={uniqueTrait} onChange={(e) => setUniqueTrait(e.target.value)} placeholder="Was macht dich einzigartig?" />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-zinc-200">
          <Button variant="ghost" onClick={prevStep} disabled={step === 0}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <Button
            onClick={nextStep}
            disabled={
              (step === 0 && (!gender || !accountType)) ||
              loading
            }
          >
            {loading ? (
              'Wird gespeichert...'
            ) : step === totalSteps - 1 ? (
              <>
                Profil abschließen
                <Check className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Weiter
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
