-- Keep the public starter polls usable after enabling server-side voting RPCs.
insert into public.campus_polls (id, question, category, options, total_votes, created_by)
values
  (
    'poll_01',
    $$What's the best first-date move on campus? 💡$$,
    'Campus Vibe Check',
    $$[{"id":"opt_1","text":"🥤 Smoothies at Senate Plaza Terrace","votes":148},{"id":"opt_2","text":"🍢 Shawarma & Suya evening banter","votes":112},{"id":"opt_3","text":"📚 Casual Library Courtyard study date","votes":54},{"id":"opt_4","text":"🚗 Weekend drive into Abuja city","votes":28}]$$::jsonb,
    342,
    null
  ),
  (
    'poll_02',
    $$Which faculty has the highest dating rizz & best dress sense? 💅👔$$,
    'UniAbuja Showdown',
    $$[{"id":"opt_1","text":"⚖️ Faculty of Law (Corporate drip)","votes":198},{"id":"opt_2","text":"🎭 Theatre Arts & Mass Comm (Runway energy)","votes":184},{"id":"opt_3","text":"💼 Management Sciences / Accounting","votes":81},{"id":"opt_4","text":"🩺 Med Squad / Health Sciences","votes":56}]$$::jsonb,
    519,
    null
  ),
  (
    'poll_03',
    $$If a campus crush asks you out right before semester exams, what's your move? 📚👀$$,
    'Exam Season Dilemma',
    $$[{"id":"opt_1","text":"📖 Library date only, we read first!","votes":210},{"id":"opt_2","text":"⚡ GPA can recover, love comes once. I'm going!","votes":114},{"id":"opt_3","text":"⏰ Postpone until after final paper!","votes":78},{"id":"opt_4","text":"🤫 Ghost for 2 weeks until exams end","votes":18}]$$::jsonb,
    420,
    null
  ),
  (
    'poll_04',
    $$Is Lowkey / Discreet Mode better than public campus dating? 🤫🔒$$,
    'Campus Relationship Pulse',
    $$[{"id":"opt_1","text":"🔒 100% Lowkey — No campus eyes, zero drama","votes":342},{"id":"opt_2","text":"✨ Public & Proud — Hand in hand across arcade","votes":180},{"id":"opt_3","text":"🤷 Depends on the partner's vibe","votes":90}]$$::jsonb,
    612,
    null
  )
on conflict (id) do nothing;
