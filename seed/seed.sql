-- FounderMatch Seed Data
-- Run this AFTER creating test users in Supabase Auth
-- Replace the UUIDs below with actual user IDs from auth.users

-- Note: In production, profiles are auto-created by the trigger.
-- For seeding, first create users in Supabase Auth Dashboard,
-- then update their profiles with this data.

-- Example: Update profiles for seeded users
-- You need to create 10 users first via Supabase Auth UI or API,
-- then use their IDs here.

-- Sample profile updates (replace UUIDs with real ones):

/*
-- Male Entrepreneurs
UPDATE profiles SET
  first_name = 'Maximilian',
  age = 34,
  city = 'München',
  gender = 'male',
  seeking_gender = 'female',
  account_type = 'entrepreneur',
  relationship_goal = 'serious',
  children_wish = 'yes',
  career_focus = 'high',
  family_orientation = 'medium',
  relationship_model = 'flexible',
  relocation = 'maybe',
  travel_frequency = 'frequently',
  bio = 'Tech-Unternehmer mit Leidenschaft für Innovation und nachhaltige Geschäftsmodelle.',
  life_in_5_years = 'Erfolgreiche Firma, Familie, Haus am See.',
  looking_for = 'Eine Partnerin, die meine Ambitionen teilt aber auch Erdung bringt.',
  unique_trait = 'Ich baue gerade mein drittes Startup und koche trotzdem jeden Abend selbst.',
  onboarding_completed = true,
  verification_status = 'verified'
WHERE id = 'USER_ID_1';

INSERT INTO values (profile_id, loyalty, ambition, family, freedom, security, spirituality, adventure, structure, communication, status_lifestyle)
VALUES ('USER_ID_1', 5, 5, 4, 3, 4, 2, 4, 3, 5, 4);

INSERT INTO business_verifications (profile_id, company_name, website, linkedin, revenue_range, status)
VALUES ('USER_ID_1', 'TechVentures GmbH', 'https://techventures.de', 'https://linkedin.com/in/maximilian', 'over_1m', 'verified');

-- User 2
UPDATE profiles SET
  first_name = 'Alexander',
  age = 41,
  city = 'Berlin',
  gender = 'male',
  seeking_gender = 'female',
  account_type = 'ceo',
  relationship_goal = 'marriage',
  children_wish = 'yes',
  career_focus = 'high',
  family_orientation = 'high',
  relationship_model = 'traditional',
  relocation = 'no',
  travel_frequency = 'monthly',
  bio = 'Geschäftsführer einer Beratungsfirma. Suche eine Partnerin für die langfristige Zukunft.',
  life_in_5_years = 'Verheiratet, Kinder, Haus in Berlin.',
  looking_for = 'Intelligente, familienorientierte Frau mit eigenen Zielen.',
  unique_trait = 'Ich habe 15 Länder bereist und spreche 4 Sprachen.',
  onboarding_completed = true,
  verification_status = 'verified'
WHERE id = 'USER_ID_2';

INSERT INTO values (profile_id, loyalty, ambition, family, freedom, security, spirituality, adventure, structure, communication, status_lifestyle)
VALUES ('USER_ID_2', 5, 4, 5, 2, 5, 3, 3, 4, 4, 3);

-- User 3
UPDATE profiles SET
  first_name = 'Philipp',
  age = 29,
  city = 'Hamburg',
  gender = 'male',
  seeking_gender = 'female',
  account_type = 'self_employed',
  relationship_goal = 'serious',
  children_wish = 'maybe',
  career_focus = 'high',
  family_orientation = 'medium',
  relationship_model = 'both_career',
  relocation = 'yes',
  travel_frequency = 'frequently',
  bio = 'Freelance Software-Architekt. Arbeite remote und liebe die Freiheit.',
  life_in_5_years = 'Eigenes SaaS-Produkt, Partnerin, vielleicht Digital Nomad zusammen.',
  looking_for = 'Jemand der Freiheit und Abenteuer genauso schätzt wie ich.',
  unique_trait = 'Ich arbeite von überall auf der Welt und habe eine Katze namens Python.',
  onboarding_completed = true,
  verification_status = 'verified'
WHERE id = 'USER_ID_3';

INSERT INTO values (profile_id, loyalty, ambition, family, freedom, security, spirituality, adventure, structure, communication, status_lifestyle)
VALUES ('USER_ID_3', 4, 5, 3, 5, 2, 1, 5, 2, 4, 3);

-- User 4
UPDATE profiles SET
  first_name = 'Daniel',
  age = 37,
  city = 'Frankfurt',
  gender = 'male',
  seeking_gender = 'female',
  account_type = 'investor',
  relationship_goal = 'marriage',
  children_wish = 'yes',
  career_focus = 'high',
  family_orientation = 'high',
  relationship_model = 'traditional',
  relocation = 'no',
  travel_frequency = 'monthly',
  bio = 'Angel Investor und Ex-Banker. Fokus auf Fintech und Nachhaltigkeit.',
  life_in_5_years = 'Familie, Portfolio mit Impact-Investments, gesunde Work-Life-Balance.',
  looking_for = 'Eine Frau mit Klasse, Intelligenz und Familienwerten.',
  unique_trait = 'Ich investiere in Startups und koche italienisch auf Sternelevel.',
  onboarding_completed = true,
  verification_status = 'verified'
WHERE id = 'USER_ID_4';

INSERT INTO values (profile_id, loyalty, ambition, family, freedom, security, spirituality, adventure, structure, communication, status_lifestyle)
VALUES ('USER_ID_4', 5, 4, 5, 2, 5, 2, 3, 5, 4, 5);

-- User 5
UPDATE profiles SET
  first_name = 'Sebastian',
  age = 32,
  city = 'Düsseldorf',
  gender = 'male',
  seeking_gender = 'female',
  account_type = 'entrepreneur',
  relationship_goal = 'family',
  children_wish = 'yes',
  career_focus = 'medium',
  family_orientation = 'high',
  relationship_model = 'flexible',
  relocation = 'maybe',
  travel_frequency = 'rarely',
  bio = 'E-Commerce Unternehmer. Habe mein Business aufgebaut, jetzt ist die Familie dran.',
  life_in_5_years = 'Verheiratet, 2 Kinder, Haus mit Garten, Business läuft auf Autopilot.',
  looking_for = 'Eine liebevolle, bodenständige Frau die Familie genauso priorisiert wie ich.',
  unique_trait = 'Mein Online-Shop läuft quasi von alleine – jetzt habe ich Zeit für die wichtigen Dinge.',
  onboarding_completed = true,
  verification_status = 'verified'
WHERE id = 'USER_ID_5';

INSERT INTO values (profile_id, loyalty, ambition, family, freedom, security, spirituality, adventure, structure, communication, status_lifestyle)
VALUES ('USER_ID_5', 5, 3, 5, 3, 4, 3, 2, 4, 5, 2);

-- Female Users

-- User 6
UPDATE profiles SET
  first_name = 'Sophie',
  age = 28,
  city = 'München',
  gender = 'female',
  seeking_gender = 'male',
  account_type = 'career_woman',
  relationship_goal = 'serious',
  children_wish = 'maybe',
  career_focus = 'high',
  family_orientation = 'medium',
  relationship_model = 'both_career',
  relocation = 'maybe',
  travel_frequency = 'monthly',
  bio = 'Marketing-Leiterin bei einem DAX-Konzern. Ambitioniert im Job und im Leben.',
  life_in_5_years = 'CMO, eigene Wohnung, einen Partner der mich wirklich versteht.',
  looking_for = 'Einen Mann der meine Karriere respektiert und eigene Ambitionen hat.',
  unique_trait = 'Ich leite ein 30-köpfiges Team und bin trotzdem die Ruhigste im Raum.',
  onboarding_completed = true,
  verification_status = 'verified'
WHERE id = 'USER_ID_6';

INSERT INTO values (profile_id, loyalty, ambition, family, freedom, security, spirituality, adventure, structure, communication, status_lifestyle)
VALUES ('USER_ID_6', 4, 5, 3, 4, 3, 1, 4, 3, 5, 4);

-- User 7
UPDATE profiles SET
  first_name = 'Laura',
  age = 31,
  city = 'Berlin',
  gender = 'female',
  seeking_gender = 'male',
  account_type = 'businesswoman',
  relationship_goal = 'marriage',
  children_wish = 'yes',
  career_focus = 'medium',
  family_orientation = 'high',
  relationship_model = 'flexible',
  relocation = 'no',
  travel_frequency = 'rarely',
  bio = 'Gründerin einer nachhaltigen Modemarke. Mode und Werte sind kein Widerspruch.',
  life_in_5_years = 'Erfolgreiche Marke, Ehemann, erstes Kind, Haus in Brandenburg.',
  looking_for = 'Einen ehrlichen, loyalen Mann der Familie und Karriere vereint.',
  unique_trait = 'Meine Modemarke spendet 10% an Bildungsprojekte.',
  onboarding_completed = true,
  verification_status = 'verified'
WHERE id = 'USER_ID_7';

INSERT INTO values (profile_id, loyalty, ambition, family, freedom, security, spirituality, adventure, structure, communication, status_lifestyle)
VALUES ('USER_ID_7', 5, 4, 5, 3, 4, 3, 3, 4, 5, 3);

-- User 8
UPDATE profiles SET
  first_name = 'Anna',
  age = 24,
  city = 'Hamburg',
  gender = 'female',
  seeking_gender = 'male',
  account_type = 'student',
  relationship_goal = 'serious',
  children_wish = 'maybe',
  career_focus = 'high',
  family_orientation = 'medium',
  relationship_model = 'both_career',
  relocation = 'yes',
  travel_frequency = 'frequently',
  bio = 'BWL-Studentin an der HSG mit Auslandssemester in Singapur. Startup-affin.',
  life_in_5_years = 'MBA abgeschlossen, in der Strategieberatung, bereit für eine Familie.',
  looking_for = 'Einen ambitionierten Mann der Wert auf Bildung und Wachstum legt.',
  unique_trait = 'Ich habe mit 22 mein erstes Side-Business profitabel gemacht.',
  onboarding_completed = true,
  verification_status = 'verified'
WHERE id = 'USER_ID_8';

INSERT INTO values (profile_id, loyalty, ambition, family, freedom, security, spirituality, adventure, structure, communication, status_lifestyle)
VALUES ('USER_ID_8', 4, 5, 3, 4, 3, 1, 5, 3, 4, 4);

-- User 9
UPDATE profiles SET
  first_name = 'Marie',
  age = 33,
  city = 'Frankfurt',
  gender = 'female',
  seeking_gender = 'male',
  account_type = 'family_oriented',
  relationship_goal = 'family',
  children_wish = 'yes',
  career_focus = 'low',
  family_orientation = 'high',
  relationship_model = 'traditional',
  relocation = 'maybe',
  travel_frequency = 'rarely',
  bio = 'Ehemalige Projektmanagerin, jetzt bewusst auf der Suche nach dem richtigen Partner für eine Familie.',
  life_in_5_years = 'Verheiratet, Mutter, ein warmes Zuhause für meine Familie.',
  looking_for = 'Einen erfolgreichen Mann der Verantwortung übernimmt und Familie priorisiert.',
  unique_trait = 'Ich habe bewusst meine Karriere pausiert um den richtigen Partner zu finden.',
  onboarding_completed = true,
  verification_status = 'verified'
WHERE id = 'USER_ID_9';

INSERT INTO values (profile_id, loyalty, ambition, family, freedom, security, spirituality, adventure, structure, communication, status_lifestyle)
VALUES ('USER_ID_9', 5, 2, 5, 2, 5, 4, 2, 5, 5, 3);

-- User 10
UPDATE profiles SET
  first_name = 'Elena',
  age = 27,
  city = 'Düsseldorf',
  gender = 'female',
  seeking_gender = 'male',
  account_type = 'ambitious_woman',
  relationship_goal = 'serious',
  children_wish = 'yes',
  career_focus = 'medium',
  family_orientation = 'high',
  relationship_model = 'flexible',
  relocation = 'no',
  travel_frequency = 'monthly',
  bio = 'Social Media Managerin mit eigenem Side-Business. Ambitioniert aber familienorientiert.',
  life_in_5_years = 'Eigene Agentur, Partner, erstes Kind geplant.',
  looking_for = 'Einen Unternehmer der versteht dass beides geht – Karriere und Familie.',
  unique_trait = 'Ich manage 500k Follower für Kunden und will trotzdem um 18 Uhr Feierabend.',
  onboarding_completed = true,
  verification_status = 'verified'
WHERE id = 'USER_ID_10';

INSERT INTO values (profile_id, loyalty, ambition, family, freedom, security, spirituality, adventure, structure, communication, status_lifestyle)
VALUES ('USER_ID_10', 5, 4, 5, 3, 4, 2, 3, 4, 5, 3);
*/

-- To use this seed data:
-- 1. Create 10 users in Supabase Auth Dashboard
-- 2. Copy their UUIDs
-- 3. Uncomment the block above
-- 4. Replace USER_ID_1 through USER_ID_10 with real UUIDs
-- 5. Run in Supabase SQL Editor
