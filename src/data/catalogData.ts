import { PremiumPlan } from '../types';

export const FACULTIES_AND_DEPARTMENTS: { faculty: string; departments: string[] }[] = [
  {
    faculty: 'Faculty of Management Sciences',
    departments: ['Accounting', 'Business Administration', 'Banking and Finance', 'Public Administration'],
  },
  {
    faculty: 'Faculty of Law',
    departments: ['Civil Law', 'Islamic & Customary Law', 'Public & International Law', 'Commercial Law'],
  },
  {
    faculty: 'College of Health Sciences',
    departments: ['Medicine & Surgery (MBBS)', 'Nursing Science', 'Medical Laboratory Science', 'Human Anatomy', 'Human Physiology'],
  },
  {
    faculty: 'Faculty of Engineering',
    departments: ['Computer Engineering', 'Electrical/Electronics Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering'],
  },
  {
    faculty: 'Faculty of Science',
    departments: ['Computer Science', 'Microbiology', 'Biochemistry', 'Physics with Electronics', 'Chemistry', 'Mathematics', 'Statistics', 'Biology', 'Zoology', 'Geology & Mining'],
  },
  {
    faculty: 'Faculty of Social Sciences',
    departments: ['Economics', 'Political Science', 'Sociology', 'Geography & Environmental Management', 'Mass Communication'],
  },
  {
    faculty: 'Faculty of Arts',
    departments: ['English and Literary Studies', 'Theatre Arts', 'History & Diplomatic Studies', 'Philosophy', 'Linguistics & African Languages'],
  },
  {
    faculty: 'Faculty of Agriculture',
    departments: ['Agricultural Economics', 'Agronomy', 'Animal Science', 'Crop Science', 'Soil Science'],
  },
  {
    faculty: 'Faculty of Veterinary Medicine',
    departments: ['Veterinary Medicine (DVM)', 'Veterinary Anatomy', 'Veterinary Pathology'],
  },
  {
    faculty: 'Faculty of Pharmacy',
    departments: ['Pharmacy (Pharm.D)', 'Pharmacology', 'Clinical Pharmacy', 'Pharmaceutical Chemistry'],
  },
  {
    faculty: 'Faculty of Education',
    departments: ['Educational Management', 'Science Education', 'Guidance & Counselling', 'Arts Education', 'Social Science Education'],
  },
];

export const PROMPT_QUESTIONS = [
  'The quickest way to my heart at UniAbuja is...',
  'My worst 8 AM lecture experience was...',
  'Best secret spot on campus...',
  'A confession I’ve never told anyone on campus...',
  'Two truths and a lie about my university life...',
  'Ideal Sunday chill spot around Abuja...',
  'My red flag during semester exams...',
  'You should NOT message me if...',
  'My dream campus late-night date...',
  'What my department taught me vs reality...',
];

export const PREMIUM_PLANS: PremiumPlan[] = [
  {
    id: 'weekly',
    name: 'Weekly Pass',
    price: '₦1,500',
    priceNum: 1500,
    period: '/ 7 days',
    features: [
      'See who liked your profile (Unblurred)',
      'Unlimited likes & swipes',
      'Rewind accidental left swipes',
      'Advanced faculty & level filtering',
    ],
  },
  {
    id: 'monthly',
    name: 'Monthly VIP',
    price: '₦4,500',
    priceNum: 4500,
    period: '/ month',
    badge: 'MOST POPULAR 🔥',
    popular: true,
    features: [
      'All Weekly Pass features included',
      'Incognito Mode (Browse unseen on campus)',
      '30-minute Profile Boost access',
      'Priority DM delivery & Read Receipts',
      'Exclusive VIP Crown Badge on profile',
    ],
  },
  {
    id: 'semester',
    name: 'Semester Royal Pass',
    price: '₦12,000',
    priceNum: 12000,
    period: '/ 4 months',
    badge: 'BEST VALUE (SAVE 35%)',
    features: [
      'Complete VIP access for the entire semester',
      'Unlimited Profile Boosts on Hall Weeks & Weekends',
      'Direct Match Super-Likes (5 per week)',
      'Unrestricted Lowkey Mode & Incognito switching',
      'Priority UniAbuja verification badge processing',
      'Exclusive entry to UoA MeetUps VIP campus mixers',
    ],
  },
];

export const CAMPUS_SAFETY_RULES = [
  {
    title: 'Always Meet in Public Campus Spaces First',
    desc: 'For your first few meetups, choose lively, well-lit campus landmarks. Avoid secluded areas or unfamiliar off-campus residences on day one.',
    icon: 'Landmark',
  },
  {
    title: 'Check for the Verified Student Badge',
    desc: 'Always check that your match is marked as verified before sharing personal contacts or making off-app plans.',
    icon: 'ShieldCheck',
  },
  {
    title: 'Inform a Trusted Roommate or Friend',
    desc: 'Tell at least one trusted person who you are meeting, when, and where. Share your live location when appropriate.',
    icon: 'Users',
  },
  {
    title: 'Arrange Your Own Transport',
    desc: 'Arrive and leave on your own terms. Never rely on someone you just met for your only ride home.',
    icon: 'Compass',
  },
  {
    title: 'Zero Tolerance for Pressure and Harassment',
    desc: 'Consent must be enthusiastic, continuous, and clear. If anyone pressures you or makes you uncomfortable, report and block them.',
    icon: 'AlertTriangle',
  },
];

export const DATING_AND_HEALTH_TIPS = [
  {
    category: 'Bio & Profile Crafting',
    title: 'How to Write an Authentic Campus Bio',
    tips: [
      'Highlight your authentic campus personality: mention your faculty, favorite campus spots, your playlist, or study vibe.',
      'Use clear photos that show your face without heavy distortion.',
      'Add playful icebreaker prompts to give potential matches an effortless opening line.',
      'Be clear about what you want: choose Dating, Lowkey, or Both.',
    ],
  },
  {
    category: 'Consent & Communication',
    title: 'The Art of Clear, Respectful Communication',
    tips: [
      'Consent is required at every stage: verbal, clear, and unforced. Maybe or silence is never a yes.',
      'Respect boundaries immediately when someone says they are not interested or want to stay lowkey.',
      'Keep what happens in Lowkey Mode private and respect confidentiality.',
    ],
  },
  {
    category: 'Mature & Safer Sex Guidance',
    title: 'Safer Sex & Sexual Wellness',
    tips: [
      'Use appropriate protection to reduce the risk of STIs and unplanned pregnancy.',
      'Routine screening is responsible, mature, and normal for sexually active adults.',
      'Seek prompt professional medical advice after a possible exposure or contraceptive failure.',
      'Never share or forward private or intimate media. Non-consensual sharing is prohibited.',
    ],
  },
];
