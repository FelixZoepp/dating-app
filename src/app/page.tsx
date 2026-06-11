import Link from 'next/link';
import { Shield, Users, Heart, Crown, CheckCircle, ArrowRight, Star, Target, Clock, ChevronDown } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md z-50 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-foreground">Founder</span>
            <span className="text-accent">Match</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-text-secondary hover:text-foreground transition-colors">
              Anmelden
            </Link>
            <Link
              href="/register"
              className="bg-accent text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              Jetzt bewerben
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-accent-muted text-accent px-4 py-1.5 rounded-full text-sm font-medium mb-8">
            <Crown className="w-4 h-4" />
            Exklusives Partnernetzwerk
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            Dating für Unternehmer und ambitionierte Singles mit klaren{' '}
            <span className="text-accent">Lebenszielen.</span>
          </h1>
          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Keine endlosen Swipes. Keine Fake-Profile. Nur kuratierte Matches nach Werten, Zukunftsplänen und echter Kompatibilität.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto bg-accent text-background px-8 py-4 rounded-xl text-base font-semibold hover:bg-accent-hover transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
            >
              Jetzt bewerben
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#wie-es-funktioniert"
              className="w-full sm:w-auto text-text-secondary px-8 py-4 rounded-xl text-base font-medium hover:text-foreground hover:bg-surface transition-colors flex items-center justify-center gap-2"
            >
              Mehr erfahren
              <ChevronDown className="w-5 h-5" />
            </Link>
          </div>
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              Verifizierte Profile
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" />
              Kuratierte Matches
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-accent" />
              Wertebasiert
            </div>
          </div>
        </div>
      </section>

      {/* Why normal dating apps fail */}
      <section className="py-20 px-4 sm:px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Warum normale Dating-Apps für Unternehmer nicht funktionieren
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Erfolgreiche Menschen brauchen einen anderen Ansatz bei der Partnerwahl.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Clock, title: 'Zeitverschwendung', desc: 'Endloses Swipen, oberflächliche Gespräche und keine echte Vorauswahl. Deine Zeit ist zu wertvoll dafür.' },
              { icon: Target, title: 'Falsche Zielgruppe', desc: 'Mainstream-Apps mischen alle zusammen. Deine Ambitionen und Lebensstandards werden nicht berücksichtigt.' },
              { icon: Shield, title: 'Keine Seriosität', desc: 'Fake-Profile, unklare Absichten und Menschen ohne echte Lebensziele. Das passt nicht zu deinem Level.' },
            ].map((item) => (
              <div key={item.title} className="bg-surface p-8 rounded-2xl border border-border">
                <div className="w-12 h-12 bg-error/10 rounded-xl flex items-center justify-center mb-5">
                  <item.icon className="w-6 h-6 text-error" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="wie-es-funktioniert" className="py-20 px-4 sm:px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              So funktioniert FounderMatch
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Ein durchdachter Prozess statt zufälligem Swipen.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Bewirb dich', desc: 'Durchlaufe unser psychologisches Onboarding mit Fragen zu Werten, Lebenszielen und Kompatibilität. Unternehmer werden verifiziert.' },
              { step: '02', title: 'Erhalte kuratierte Vorschläge', desc: 'Unser Algorithmus berechnet Kompatibilität basierend auf Werten, Lebensmodellen und Zukunftsplänen — nicht auf Aussehen.' },
              { step: '03', title: 'Verbinde dich', desc: 'Zeige Interesse an ausgewählten Profilen. Bei gegenseitigem Interesse entsteht ein Match und ihr könnt chatten.' },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-6xl font-bold text-accent/10 mb-4" style={{ fontFamily: 'var(--font-display)' }}>{item.step}</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For whom */}
      <section className="py-20 px-4 sm:px-6 bg-surface border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Für wen ist FounderMatch?
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Unsere Plattform richtet sich an Menschen mit Ambitionen und klaren Lebenszielen.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-surface-2 p-8 rounded-2xl border border-border">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-foreground">
                <div className="w-10 h-10 bg-accent-muted rounded-lg flex items-center justify-center">
                  <Crown className="w-5 h-5 text-accent" />
                </div>
                Für Ihn
              </h3>
              <ul className="space-y-3">
                {['Unternehmer & Gründer', 'Selbstständige', 'Geschäftsführer & C-Level', 'Investoren'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-text-secondary">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-surface-2 p-8 rounded-2xl border border-border">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-foreground">
                <div className="w-10 h-10 bg-accent-muted rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-accent" />
                </div>
                Für Sie
              </h3>
              <ul className="space-y-3">
                {['Ambitionierte Frauen', 'Unternehmerinnen', 'Karrierefrauen', 'Studentinnen mit Zielen', 'Familienorientierte Frauen'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-text-secondary">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Exclusivity */}
      <section className="py-20 px-4 sm:px-6 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-accent-muted text-accent px-4 py-1.5 rounded-full text-sm font-medium mb-8">
            <Shield className="w-4 h-4" />
            Verifizierung & Exklusivität
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            Qualität statt Quantität
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed">
            Jeder Unternehmer wird manuell verifiziert. Wir prüfen Unternehmensangaben, LinkedIn-Profile und Handelsregisterdaten. So stellen wir sicher, dass nur echte, seriöse Mitglieder auf der Plattform sind.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { num: '100%', label: 'Verifizierte Unternehmer' },
              { num: '<50', label: 'Neue Mitglieder pro Woche' },
              { num: '87%', label: 'Antwortrate' },
            ].map((stat) => (
              <div key={stat.label} className="p-6">
                <div className="text-3xl font-bold text-accent mb-1" style={{ fontFamily: 'var(--font-display)' }}>{stat.num}</div>
                <div className="text-sm text-text-secondary">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium */}
      <section className="py-20 px-4 sm:px-6 bg-surface border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Premium-Mitgliedschaft
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Investiere in dein Liebesleben wie in dein Business — mit dem richtigen Plan.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Basic', price: 'Kostenlos', features: ['Profil erstellen', '3 Vorschläge / Woche', 'Interesse zeigen (begrenzt)'] },
              { name: 'Premium', price: '79 €/Monat', popular: true, features: ['20 Vorschläge / Woche', 'Sehen, wer Interesse zeigt', 'Erweiterte Filter', 'Höhere Sichtbarkeit'] },
              { name: 'Elite', price: '199 €/Monat', features: ['Priorisierte Ausspielung', 'Profilanalyse', 'Exklusive Mitglieder', 'Concierge-Vorbereitung'] },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`p-8 rounded-2xl border ${
                  plan.popular
                    ? 'border-accent ring-1 ring-accent/20 relative bg-surface-2'
                    : 'border-border bg-surface-2'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-background text-xs font-semibold px-3 py-1 rounded-full">
                    Beliebt
                  </div>
                )}
                <h3 className="text-lg font-semibold text-foreground mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold text-foreground mb-6" style={{ fontFamily: 'var(--font-display)' }}>{plan.price}</div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                      <CheckCircle className={`w-4 h-4 shrink-0 ${plan.popular ? 'text-accent' : 'text-accent/60'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block w-full text-center py-3 rounded-lg text-sm font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-accent text-background hover:bg-accent-hover'
                      : 'bg-surface text-foreground hover:bg-border'
                  }`}
                >
                  Jetzt starten
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-12 text-center" style={{ fontFamily: 'var(--font-display)' }}>
            Häufige Fragen
          </h2>
          <div className="space-y-6">
            {[
              { q: 'Wie unterscheidet sich FounderMatch von Tinder oder Bumble?', a: 'FounderMatch setzt auf Qualität statt Quantität. Statt endlosem Swipen erhältst du wenige, hochwertige und kuratierte Vorschläge basierend auf Werten, Lebenszielen und echter Kompatibilität.' },
              { q: 'Wie werden Unternehmer verifiziert?', a: 'Wir prüfen Unternehmensangaben wie Firmenname, Website, LinkedIn-Profil und optional Handelsregisterdaten. Nur verifizierte Mitglieder erhalten das Verifizierungsabzeichen.' },
              { q: 'Ist die Plattform nur für Unternehmer?', a: 'Nein. FounderMatch ist für alle ambitionierten Singles mit klaren Lebenszielen — Unternehmer, Karrierefrauen, Studentinnen und familienorientierte Menschen.' },
              { q: 'Wie viele Vorschläge erhalte ich?', a: 'Basic-Mitglieder erhalten 3 kuratierte Vorschläge pro Woche, Premium-Mitglieder 20. Qualität vor Quantität ist unser Prinzip.' },
              { q: 'Was ist das Concierge-Matching?', a: 'Unser Premium-Service für anspruchsvolle Mitglieder. Ein persönlicher Matchmaker wählt manuell passende Partner aus und stellt sie persönlich vor.' },
            ].map((item) => (
              <div key={item.q} className="border-b border-border pb-6">
                <h3 className="text-base font-semibold text-foreground mb-2">{item.q}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 bg-surface border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Bereit für Matches, die zu deinem Leben passen?
          </h2>
          <p className="text-text-secondary mb-8 max-w-xl mx-auto">
            Bewirb dich jetzt und werde Teil eines exklusiven Netzwerks von Unternehmern und ambitionierten Singles.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-accent text-background px-8 py-4 rounded-xl text-base font-semibold hover:bg-accent-hover transition-all shadow-lg shadow-accent/20"
          >
            Jetzt bewerben
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-text-secondary">
            © 2024 FounderMatch. Alle Rechte vorbehalten.
          </div>
          <div className="flex items-center gap-6 text-sm text-text-secondary">
            <Link href="#" className="hover:text-foreground transition-colors">Datenschutz</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Impressum</Link>
            <Link href="#" className="hover:text-foreground transition-colors">AGB</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
