export type AppMode = 'normal' | 'lowkey';

export type LookingFor = 'dating' | 'lowkey' | 'both';

export type Gender = 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say' | 'Other';

export type StudentLevel = '100L' | '200L' | '300L' | '400L' | '500L';

export type CampusLocation = 'Main Campus' | 'Mini Campus' | 'Permanent Site' | 'Off-Campus' | 'Hostel (Male Block)' | 'Hostel (Female Block)';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'approved' | 'rejected';

export interface PromptItem {
  id: string;
  question: string;
  answer: string;
}

export interface CampusStory {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  storyImage: string;
  caption: string;
  tag: string;
  postedAt: string;
  department: string;
  level: string;
}

export interface CampusPollOption {
  id: string;
  text: string;
  votes: number;
}

export interface CampusPoll {
  id: string;
  question: string;
  category: string;
  totalVotes: number;
  options: CampusPollOption[];
  userVotedOptionId?: string;
  createdBy?: string;
}

export interface GossipComment {
  id: string;
  authorName: string;
  authorAvatar?: string;
  authorBadge?: string;
  isAnonymous: boolean;
  content: string;
  createdAt: number;
  timeAgo: string;
  likes: number;
  userLiked?: boolean;
}

export interface GossipPost {
  id: string;
  authorId?: string;
  authorName: string;
  authorAvatar?: string;
  authorDepartment?: string;
  authorLevel?: string;
  isAnonymous: boolean;
  anonymousAlias?: string;
  tag: string; // e.g. '🔥 Hot Tea', '👀 Campus Crush', '🍿 Faculty Gist', '🤫 Lowkey Confession', '🏛️ Hostel Drama', '💔 Situationship'
  content: string;
  imageUrl?: string;
  createdAt: number;
  timeAgo: string;
  spicyCount: number;
  capCount: number;
  factsCount: number;
  teaCount: number;
  userReaction?: 'spicy' | 'cap' | 'facts' | 'tea';
  comments: GossipComment[];
  isPinned?: boolean;
  viewsCount: number;
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  username: string;
  gender: Gender;
  faculty: string;
  department: string;
  course: string;
  level: StudentLevel;
  campusLocation: CampusLocation;
  bio: string;
  photos: string[];
  lookingFor: LookingFor;
  mode: AppMode;
  icebreakerPrompts: PromptItem[];
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  selfieUrl?: string;
  studentIdCardUrl?: string;
  lastActive: string; // e.g. "Just now", "5m ago", "1h ago"
  isOnline: boolean;
  distanceKm?: number;
  badges: string[];
  isIncognito?: boolean;
  isBoosted?: boolean;
  boostExpiresAt?: string;
  isBanned?: boolean;
  instagramHandle?: string;
  snapchatHandle?: string;
  spotifyTopArtist?: string;
  interests?: string[];
  voiceNoteText?: string;
  voiceNoteDuration?: string;
  campusVibe?: string;
  currentStatus?: string;
}

export interface MatchItem {
  id: string;
  matchedUser: UserProfile;
  createdAt: number;
  expiresAt: number; // 7 days in milliseconds
  lastMessage?: string;
  lastMessageTime?: number;
  hasUnread?: boolean;
  isLowkeyMatch?: boolean;
}

export interface ChatMessage {
  id: string;
  matchId: string;
  senderId: string;
  text: string;
  imageUrl?: string;
  isPhotoViewOnce?: boolean;
  isPhotoViewed?: boolean;
  createdAt: number;
  read: boolean;
}

export type ReportReason =
  | 'fake_profile'
  | 'harassment'
  | 'inappropriate_content'
  | 'spam'
  | 'non_consensual'
  | 'underage'
  | 'scam'
  | 'other';

export interface UserReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetUserId: string;
  targetUserName: string;
  targetUsername: string;
  targetPhoto: string;
  reason: ReportReason;
  details: string;
  status: 'pending' | 'resolved' | 'banned' | 'dismissed';
  createdAt: number;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  username: string;
  faculty: string;
  department: string;
  profilePhoto: string;
  liveSelfiePhoto: string;
  studentIdPhoto?: string;
  submittedAt: number;
  status: VerificationStatus;
  adminNote?: string;
}

export interface FilterState {
  gender: string; // 'all' | 'Male' | 'Female' | 'Non-binary'
  mode: AppMode | 'all';
  faculty: string; // 'all' or specific faculty
  department: string; // 'all' or specific dept
  level: string; // 'all' or '100L', etc.
  onlyMyFaculty: boolean;
  onlyMyDepartment: boolean;
  onlyVerified: boolean;
  searchQuery: string;
}

export interface PremiumPlan {
  id: 'weekly' | 'monthly' | 'semester';
  name: string;
  price: string;
  priceNum: number;
  period: string;
  badge?: string;
  popular?: boolean;
  features: string[];
}

export type NavigationTab = 
  | 'discover'
  | 'likes'
  | 'matches'
  | 'safety'
  | 'tips'
  | 'guidelines'
  | 'profile'
  | 'admin';
