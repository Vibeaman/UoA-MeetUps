import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import {
  UserProfile,
  MatchItem,
  ChatMessage,
  UserReport,
  VerificationRequest,
  FilterState,
  AppMode,
  NavigationTab,
  CampusStory,
  CampusPoll,
  CampusAlert,
  GossipPost,
  GossipComment,
  AdminMetrics,
  PremiumEntitlement,
} from '../types';
import { supabaseService } from '../services/supabaseService';
import { getSupabase, isSupabaseConfigured, SUPABASE_URL_DISPLAY } from '../lib/supabase';

type AuthModalMode = 'login' | 'signup';

interface AppContextType {
  currentUser: UserProfile;
  updateCurrentUser: (updates: Partial<UserProfile>) => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isEmailVerified: boolean;
  authenticateUser: (userId?: string, emailVerified?: boolean) => void;
  signOut: () => void;
  refreshAuthentication: () => Promise<{ isAuthenticated: boolean; isEmailVerified: boolean; hasSession: boolean; userId?: string }>;
  requestAuthentication: () => boolean;
  isAdminAuthenticated: boolean;
  authenticateAdmin: (password: string) => Promise<boolean>;
  logoutAdmin: () => void;
  adminMetrics: AdminMetrics | null;
  refreshAdminMetrics: () => Promise<boolean>;
  currentMode: AppMode;
  toggleAppMode: (mode?: AppMode) => Promise<boolean>;
  profiles: UserProfile[];
  swipedProfileIds: string[];
  swipeRight: (profile: UserProfile) => Promise<void>;
  swipeLeft: (profile: UserProfile) => void;
  superLike: (profile: UserProfile) => Promise<void>;
  blockedUserIds: string[];
  rewindLastSwipe: () => Promise<boolean>;
  canRewind: boolean;
  matches: MatchItem[];
  currentChatMatch: MatchItem | null;
  setCurrentChatMatch: (match: MatchItem | null) => void;
  messages: Record<string, ChatMessage[]>;
  sendMessage: (matchId: string, text: string, imageUrl?: string, isPhotoViewOnce?: boolean) => Promise<boolean>;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  recentMatch: UserProfile | null;
  setRecentMatch: (profile: UserProfile | null) => void;
  whoLikedMeProfiles: UserProfile[];
  isPremium: boolean;
  activePlan: PremiumEntitlement['planId'] | null;
  activatePremium: (planId: 'weekly' | 'monthly' | 'semester') => void;
  reports: UserReport[];
  submitReport: (targetUser: UserProfile, reason: UserReport['reason'], details: string) => Promise<boolean>;
  blockUser: (userId: string) => Promise<void>;
  unmatchUser: (matchId: string) => Promise<void>;
  verificationRequests: VerificationRequest[];
  submitVerification: (selfieUrl: string, idCardUrl?: string) => Promise<boolean>;
  // Admin actions
  approveVerification: (requestId: string) => Promise<boolean>;
  rejectVerification: (requestId: string, note?: string) => Promise<boolean>;
  resolveReport: (reportId: string, action: 'ban' | 'dismiss') => Promise<void>;
  banUser: (userId: string) => Promise<void>;
  unbanUser: (userId: string) => Promise<void>;
  toggleUserVerification: (userId: string) => Promise<boolean>;
  deleteGossipPost: (postId: string) => Promise<void>;
  deleteCampusPoll: (pollId: string) => Promise<void>;
  broadcastCampusAlert: (headline: string, message: string) => Promise<boolean>;
  campusAlerts: CampusAlert[];
  clearLocalCache: () => void;
  // Modals
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: AuthModalMode;
  openAuthModal: (mode?: AuthModalMode) => void;
  isVerificationModalOpen: boolean;
  setIsVerificationModalOpen: (open: boolean) => void;
  isPremiumModalOpen: boolean;
  setIsPremiumModalOpen: (open: boolean) => void;
  isFiltersModalOpen: boolean;
  setIsFiltersModalOpen: (open: boolean) => void;
  isProfileEditModalOpen: boolean;
  setIsProfileEditModalOpen: (open: boolean) => void;
  isBoostActive: boolean;
  triggerBoost: () => void;
  boostTimeLeft: number;
  // Stories & Polls
  stories: CampusStory[];
  activeStory: CampusStory | null;
  setActiveStory: (story: CampusStory | null) => void;
  addCampusStory: (caption: string, tag: string, storyImageUrl?: string) => Promise<boolean>;
  campusPoll?: CampusPoll;
  campusPolls: CampusPoll[];
  activePollIndex: number;
  setActivePollIndex: (idx: number) => void;
  voteCampusPoll: (pollId: string, optionId: string) => Promise<boolean>;
  addCampusPoll: (question: string, category: string, options: string[]) => Promise<boolean>;
  selectedVibeFilter: string;
  setSelectedVibeFilter: (vibe: string) => void;
  sendDirectSpark: (profile: UserProfile, text: string) => Promise<boolean>;
  sparkToast: { show: boolean; message: string } | null;
  setSparkToast: (val: { show: boolean; message: string } | null) => void;
  // Gossip Board
  gossipPosts: GossipPost[];
  addGossipPost: (
    content: string,
    tag: string,
    isAnonymous: boolean,
    anonymousAlias?: string,
    imageUrl?: string
  ) => Promise<boolean>;
  reactToGossipPost: (postId: string, reactionType: 'spicy' | 'cap' | 'facts' | 'tea') => void;
  addGossipComment: (postId: string, content: string, isAnonymous: boolean) => Promise<boolean>;
  likeGossipComment: (postId: string, commentId: string) => Promise<boolean>;
  reportGossipPost: (postId: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_USER: 'uoa_current_user_v3',
  PROFILES: 'uoa_profiles_v3',
  SWIPED_IDS: 'uoa_swiped_ids_v3',
  MATCHES: 'uoa_matches_v3',
  MESSAGES: 'uoa_messages_v3',
  REPORTS: 'uoa_reports_v3',
  VERIFICATIONS: 'uoa_verifications_v3',
  IS_AUTHENTICATED: 'uoa_is_authenticated_v1',
};

const scopedStorageKey = (key: string, userId: string) => `${key}:${userId}`;

const readStoredJson = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
};

const removeScopedStorage = (key: string) => {
  const prefix = `${key}:`;
  Object.keys(localStorage)
    .filter((storageKey) => storageKey.startsWith(prefix))
    .forEach((storageKey) => localStorage.removeItem(storageKey));
};

const EMPTY_CURRENT_USER: UserProfile = {
  id: '',
  name: '',
  age: 0,
  username: '',
  gender: 'Prefer not to say',
  faculty: '',
  department: '',
  course: '',
  level: '100L',
  campusLocation: 'Main Campus',
  bio: '',
  photos: [],
  lookingFor: 'both',
  mode: 'normal',
  icebreakerPrompts: [],
  isVerified: false,
  verificationStatus: 'unverified',
  lastActive: '',
  isOnline: false,
  badges: [],
  interests: [],
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Current user state
  const [currentUser, setCurrentUser] = useState<UserProfile>(EMPTY_CURRENT_USER);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<NavigationTab>(() => {
    const pathname = typeof window !== 'undefined' ? window.location.pathname.replace(/\/+$/, '') || '/' : '/';
    return pathname === '/admin' ? 'admin' : 'discover';
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminProof, setAdminProof] = useState<string | null>(null);
  const [adminMetrics, setAdminMetrics] = useState<AdminMetrics | null>(null);
  const [currentMode, setCurrentMode] = useState<AppMode>(currentUser.mode || 'normal');

  useEffect(() => {
    setCurrentMode(currentUser.mode || 'normal');
  }, [currentUser.mode]);

  const authenticateAdmin = async (password: string) => {
    try {
      const { data, error } = await getSupabase().functions.invoke('admin-auth', {
        body: { password: password.trim().toUpperCase() },
      });
      const proof = typeof data?.proof === 'string' ? data.proof : '';

      if (error || !data?.authenticated || !proof) {
        setAdminProof(null);
        setAdminMetrics(null);
        setIsAdminAuthenticated(false);
        return false;
      }

      setAdminProof(proof);
      setIsAdminAuthenticated(true);
      const [requests, metrics, remoteReports] = await Promise.all([
        supabaseService.fetchAdminVerificationRequests(proof),
        supabaseService.fetchAdminMetrics(proof),
        supabaseService.fetchAdminReports(proof),
      ]);
      if (requests) setVerificationRequests(requests);
      if (metrics) setAdminMetrics(metrics);
      if (remoteReports) setReports(remoteReports);
      return true;
    } catch (error) {
      console.warn(`Admin authorization request failed for ${SUPABASE_URL_DISPLAY}:`, error);
      setAdminProof(null);
      setAdminMetrics(null);
      setIsAdminAuthenticated(false);
      return false;
    }
  };

  const logoutAdmin = () => {
    setAdminProof(null);
    setAdminMetrics(null);
    setReports([]);
    setIsAdminAuthenticated(false);
  };

  const refreshAdminMetrics = async () => {
    if (!adminProof) return false;
    const metrics = await supabaseService.fetchAdminMetrics(adminProof);
    if (!metrics) return false;
    setAdminMetrics(metrics);
    return true;
  };

  // Profiles
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [whoLikedMeProfiles, setWhoLikedMeProfiles] = useState<UserProfile[]>([]);

  const [swipedProfileIds, setSwipedProfileIds] = useState<string[]>([]);
  const [accountStateUserId, setAccountStateUserId] = useState<string | null>(null);

  const [lastSwipedId, setLastSwipedId] = useState<string | null>(null);

  // Matches (7 days expiration timestamp = 7 * 24 * 60 * 60 * 1000)
  const [matches, setMatches] = useState<MatchItem[]>([]);

  // Messages per matchId
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});

  const [currentChatMatch, setCurrentChatMatch] = useState<MatchItem | null>(null);
  const [recentMatch, setRecentMatch] = useState<UserProfile | null>(null);

  // Premium State
  const [isPremium, setIsPremium] = useState(false);
  const [activePlan, setActivePlan] = useState<PremiumEntitlement['planId'] | null>(null);

  // Boost timer
  const [isBoostActive, setIsBoostActive] = useState<boolean>(false);
  const [boostTimeLeft, setBoostTimeLeft] = useState<number>(0);

  // Reports
  const [reports, setReports] = useState<UserReport[]>([]);

  // Verifications
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('signup');

  const openAuthModal = (mode: AuthModalMode = 'signup') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const authenticateUser = (userId?: string, emailVerified = false) => {
    setIsAuthenticated(true);
    setIsEmailVerified(emailVerified);
    if (userId) {
      setCurrentUser((prev) => ({ ...prev, id: userId }));
    }
  };

  const signOut = () => {
    setIsAuthenticated(false);
    setIsEmailVerified(false);
    setCurrentUser(EMPTY_CURRENT_USER);
    setProfiles([]);
    setMatches([]);
    setMessages({});
    setCurrentChatMatch(null);
    setRecentMatch(null);
    setIsPremium(false);
    setActivePlan(null);
    setSwipedProfileIds([]);
    setReports([]);
    setVerificationRequests([]);
    localStorage.removeItem(STORAGE_KEYS.IS_AUTHENTICATED);
    localStorage.removeItem('uoa_is_premium_v2');
    localStorage.removeItem('uoa_active_plan_v2');
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.SWIPED_IDS);
    localStorage.removeItem(STORAGE_KEYS.MATCHES);
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.REPORTS);
    localStorage.removeItem(STORAGE_KEYS.VERIFICATIONS);
    void getSupabase().auth.signOut();
  };

  const refreshAuthentication = async () => {
    const supabase = getSupabase();
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      setIsAuthenticated(false);
      setIsEmailVerified(false);
      return { isAuthenticated: false, isEmailVerified: false, hasSession: false };
    }

    const { data: refreshedSession } = await supabase.auth.refreshSession();
    const refreshedUser = refreshedSession.session?.user;
    const { data, error } = await supabase.auth.getUser();
    const user = data.user || refreshedUser;
    const verified = Boolean(user?.email_confirmed_at || user?.confirmed_at);
    const authenticated = !error && Boolean(user);

    setIsAuthenticated(authenticated);
    setIsEmailVerified(verified);
    if (authenticated && user) {
      setCurrentUser((prev) => ({ ...prev, id: user.id }));
    }

    return { isAuthenticated: authenticated, isEmailVerified: verified, hasSession: true, userId: user?.id };
  };

  const requestAuthentication = () => {
    if (isAuthenticated) return true;
    openAuthModal('signup');
    return false;
  };

  const applyPremiumEntitlement = (entitlement: PremiumEntitlement | null) => {
    const isActive = Boolean(
      entitlement?.status === 'active' && new Date(entitlement.expiresAt).getTime() > Date.now(),
    );
    setIsPremium(isActive);
    setActivePlan(isActive ? entitlement?.planId || null : null);
  };
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    gender: 'all',
    mode: 'all',
    faculty: 'all',
    department: 'all',
    level: 'all',
    onlyMyFaculty: false,
    onlyMyDepartment: false,
    onlyVerified: false,
    searchQuery: '',
  });

  // Only keep the authentication marker globally; user data and behavior state are account-scoped.
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.IS_AUTHENTICATED);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const userId = isAuthenticated && currentUser.id ? currentUser.id : null;
    setAccountStateUserId(userId);
    setBlockedUserIds([]);
    setWhoLikedMeProfiles([]);
    setCurrentChatMatch(null);
    setRecentMatch(null);
    setIsPremium(false);
    setActivePlan(null);

    if (!userId) {
      setSwipedProfileIds([]);
      setMatches([]);
      setMessages({});
      setReports([]);
      setVerificationRequests([]);
      return;
    }

    setSwipedProfileIds(readStoredJson(scopedStorageKey(STORAGE_KEYS.SWIPED_IDS, userId), []));
    // Matches and messages are server-backed. Never restore another account's browser cache.
    setMatches([]);
    setMessages({});
    // Reports and verification requests are admin/server data, not per-account browser caches.
    setReports([]);
    setVerificationRequests([]);
  }, [isAuthenticated, currentUser.id]);

  useEffect(() => {
    const supabase = getSupabase();
    let cancelled = false;

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      const user = data.session?.user;
      const verified = Boolean(user?.email_confirmed_at || user?.confirmed_at);
      setIsAuthenticated(Boolean(user));
      setIsEmailVerified(verified);
      if (user) {
        setCurrentUser((prev) => ({ ...prev, id: user.id }));
      }
      setIsAuthLoading(false);
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      const verified = Boolean(user?.email_confirmed_at || user?.confirmed_at);
      setIsAuthenticated(Boolean(user));
      setIsEmailVerified(verified);
      if (user) {
        setCurrentUser((prev) => ({ ...prev, id: user.id }));
      }
      setIsAuthLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    void supabaseService.fetchProfiles().then((remoteProfiles) => {
      if (!cancelled && remoteProfiles) setProfiles(remoteProfiles);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !currentUser.id || !isSupabaseConfigured()) {
      setBlockedUserIds([]);
      setWhoLikedMeProfiles([]);
      return;
    }
    let cancelled = false;
    void Promise.all([
      supabaseService.fetchProfile(currentUser.id),
      supabaseService.fetchBlockedUserIds(currentUser.id),
      supabaseService.fetchWhoLikedMe(currentUser.id),
    ]).then(([profile, blockedIds, likedProfiles]) => {
      if (cancelled) return;
      if (profile) setCurrentUser(profile);
      if (blockedIds) setBlockedUserIds(blockedIds);
      if (likedProfiles) setWhoLikedMeProfiles(likedProfiles);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, currentUser.id]);

  useEffect(() => {
    // Never carry the previous account’s Premium state while the new account hydrates.
    applyPremiumEntitlement(null);
    if (!isAuthenticated || !currentUser.id || !isSupabaseConfigured()) return;

    let cancelled = false;
    void supabaseService.fetchPremiumEntitlement(currentUser.id).then((entitlement) => {
      if (!cancelled) applyPremiumEntitlement(entitlement);
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, currentUser.id]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser.id || !isSupabaseConfigured()) {
      if (!isAuthenticated) {
        setMatches([]);
        setMessages({});
      }
      return;
    }

    let cancelled = false;
    void supabaseService.fetchUserChatHistory(currentUser.id).then((history) => {
      if (!cancelled && history) {
        setMatches(history.matches);
        setMessages(history.messages);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, currentUser.id]);

  useEffect(() => {
    if (!isAuthenticated || !accountStateUserId || accountStateUserId !== currentUser.id) return;
    localStorage.setItem(
      scopedStorageKey(STORAGE_KEYS.SWIPED_IDS, accountStateUserId),
      JSON.stringify(swipedProfileIds),
    );
  }, [isAuthenticated, accountStateUserId, currentUser.id, swipedProfileIds]);

  // Matches, messages, reports, and verification requests are intentionally not written to shared local storage.
  // Their authoritative state comes from Supabase/admin hydration and is reset on account changes above.

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const anonymousIdKey = 'uoa_anonymous_id_v1';
    const anonymousId = localStorage.getItem(anonymousIdKey) || `anon_${crypto.randomUUID()}`;
    localStorage.setItem(anonymousIdKey, anonymousId);
    const sessionId = `session_${crypto.randomUUID()}`;
    const startedAt = Date.now();

    const flushSession = (ended = false) => {
      const now = Date.now();
      void supabaseService.upsertSiteSession({
        id: sessionId,
        userId: currentUser.id || undefined,
        anonymousId,
        startedAt: new Date(startedAt).toISOString(),
        lastSeenAt: new Date(now).toISOString(),
        durationSeconds: Math.max(0, (now - startedAt) / 1000),
        endedAt: ended ? new Date(now).toISOString() : undefined,
      });
    };

    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'hidden') flushSession();
    }, 30_000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushSession(true);
    };
    const handlePageHide = () => flushSession(true);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    flushSession();

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      flushSession(true);
    };
  }, [currentUser.id]);

  // Hydrate Boost from the server-issued expiration timestamp.
  useEffect(() => {
    const expiresAt = currentUser.boostExpiresAt ? new Date(currentUser.boostExpiresAt).getTime() : 0;
    const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
    setBoostTimeLeft(remaining);
    setIsBoostActive(remaining > 0);
  }, [currentUser.boostExpiresAt]);

  // Boost timer countdown
  useEffect(() => {
    if (!isBoostActive || boostTimeLeft <= 0) return;
    const interval = window.setInterval(() => {
      setBoostTimeLeft((prev) => {
        if (prev <= 1) {
          setIsBoostActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isBoostActive, boostTimeLeft]);

  // Stories & Highlights State (live Supabase rows only)
  const [stories, setStories] = useState<CampusStory[]>([]);
  const [activeStory, setActiveStory] = useState<CampusStory | null>(null);
  const [campusAlerts, setCampusAlerts] = useState<CampusAlert[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    void Promise.all([
      supabaseService.fetchCampusStories(),
      supabaseService.fetchCampusAlerts(),
    ]).then(([remoteStories, remoteAlerts]) => {
      if (cancelled) return;
      if (remoteStories) {
        setStories((currentStories) => {
          const remoteIds = new Set(remoteStories.map((story) => story.id));
          const locallyCreatedStories = currentStories.filter((story) => !remoteIds.has(story.id));
          return [...locallyCreatedStories, ...remoteStories];
        });
      }
      if (remoteAlerts) setCampusAlerts(remoteAlerts);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const addCampusStory = async (caption: string, tag: string, storyImageUrl?: string): Promise<boolean> => {
    if (!requestAuthentication() || !storyImageUrl || !currentUser.photos.length) return false;

    const newStory: CampusStory = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      userName: currentUser.name,
      avatar: currentUser.photos[0],
      storyImage: storyImageUrl,
      caption,
      tag: tag || 'Campus Vibe',
      postedAt: '',
      department: currentUser.department,
      level: currentUser.level,
    };
    const createdStory = await supabaseService.createCampusStory(newStory);
    if (!createdStory) return false;

    setStories((prev) => [createdStory, ...prev]);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
    return true;
  };

  // Campus Daily Polls State (live Supabase rows only)
  const [campusPolls, setCampusPolls] = useState<CampusPoll[]>([]);
  const [activePollIndex, setActivePollIndex] = useState<number>(0);

  const campusPoll = campusPolls[activePollIndex] || campusPolls[0];

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    void supabaseService.fetchCampusPolls().then((remotePolls) => {
      if (!cancelled && remotePolls) setCampusPolls(remotePolls);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const voteCampusPoll = async (pollId: string, optionId: string): Promise<boolean> => {
    if (!requestAuthentication()) return false;

    const existingPoll = campusPolls.find((poll) => poll.id === pollId);
    if (!existingPoll || existingPoll.userVotedOptionId === optionId) return false;

    const remotePoll = await supabaseService.voteCampusPoll(pollId, optionId);
    if (!remotePoll) {
      setSparkToast({ show: true, message: 'Your poll vote could not be saved. Please try again.' });
      setTimeout(() => setSparkToast(null), 3500);
      return false;
    }

    setCampusPolls((prevPolls) =>
      prevPolls.map((poll) =>
        poll.id === pollId
          ? {
              ...poll,
              options: remotePoll.options,
              totalVotes: remotePoll.totalVotes,
              userVotedOptionId: remotePoll.userVotedOptionId,
            }
          : poll
      )
    );

    confetti({
      particleCount: 35,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#a855f7', '#ec4899', '#f43f5e', '#38bdf8'],
    });
    return true;
  };

  const addCampusPoll = async (question: string, category: string, options: string[]): Promise<boolean> => {
    if (!requestAuthentication()) return false;

    const newPoll: CampusPoll = {
      id: `poll_${Date.now()}`,
      question,
      category: category || 'Campus Vibe',
      totalVotes: 0,
      createdBy: currentUser.id,
      options: options.map((text, idx) => ({
        id: `opt_${Date.now()}_${idx}`,
        text,
        votes: 0,
      })),
    };
    const persisted = await supabaseService.upsertCampusPoll(newPoll);
    if (!persisted) {
      setSparkToast({ show: true, message: 'Your campus poll could not be saved. Please try again.' });
      setTimeout(() => setSparkToast(null), 3500);
      return false;
    }

    setCampusPolls((prev) => [newPoll, ...prev]);
    setActivePollIndex(0);
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.6 },
    });
    return true;
  };

  // Gossip Board State (live Supabase rows only)
  const [gossipPosts, setGossipPosts] = useState<GossipPost[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    void supabaseService.fetchGossipPosts().then(async (remotePosts) => {
      if (cancelled || !remotePosts) return;
      const hydratedPosts = await Promise.all(remotePosts.map(async (post) => ({
        ...post,
        comments: await supabaseService.fetchGossipComments(post.id) || post.comments,
      })));
      if (!cancelled) setGossipPosts(hydratedPosts);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const addGossipPost = async (
    content: string,
    tag: string,
    isAnonymous: boolean,
    anonymousAlias?: string,
    imageUrl?: string
  ): Promise<boolean> => {
    if (!requestAuthentication()) return false;

    const newPost: GossipPost = {
      id: `gossip_${Date.now()}`,
      authorId: currentUser.id,
      authorName: isAnonymous ? (anonymousAlias || 'Anonymous Student 🎭') : currentUser.name,
      authorAvatar: isAnonymous ? undefined : currentUser.photos[0],
      authorDepartment: currentUser.department,
      authorLevel: currentUser.level,
      isAnonymous,
      anonymousAlias: isAnonymous ? (anonymousAlias || 'Anon Student 🎭') : undefined,
      tag: tag || '🔥 Hot Tea',
      content,
      imageUrl,
      createdAt: Date.now(),
      timeAgo: 'Just now',
      spicyCount: 0,
      capCount: 0,
      factsCount: 0,
      teaCount: 0,
      viewsCount: 0,
      comments: [],
    };

    const persisted = await supabaseService.createGossipPost(newPost);
    if (!persisted) {
      setSparkToast({ show: true, message: 'Your gossip post could not be saved. Please try again.' });
      setTimeout(() => setSparkToast(null), 3500);
      return false;
    }

    setGossipPosts((prev) => [newPost, ...prev]);
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#ec4899', '#f97316', '#fbbf24'],
    });
    return true;
  };

  const reactToGossipPost = async (postId: string, reactionType: 'spicy' | 'cap' | 'facts' | 'tea'): Promise<void> => {
    if (!requestAuthentication()) return;
    const remoteReaction = await supabaseService.reactToGossipPost(postId, reactionType);
    if (!remoteReaction) {
      setSparkToast({ show: true, message: 'Reaction could not be saved. Please try again.' });
      return;
    }
    setGossipPosts((prev) => prev.map((post) => post.id === postId ? { ...post, ...remoteReaction } : post));
  };

  const addGossipComment = async (postId: string, content: string, isAnonymous: boolean): Promise<boolean> => {
    if (!requestAuthentication()) return false;

    const newComment: GossipComment = {
      id: `comm_${Date.now()}`,
      authorName: isAnonymous
        ? `Anon ${currentUser.department.split(' ')[0]}`
        : `${currentUser.name.split(' ')[0]} (${currentUser.department})`,
      authorAvatar: isAnonymous ? undefined : currentUser.photos[0],
      authorBadge: currentUser.isVerified ? 'Verified Student' : undefined,
      isAnonymous,
      content,
      createdAt: Date.now(),
      timeAgo: 'Just now',
      likes: 0,
      userLiked: false,
    };

    const persisted = await supabaseService.createGossipComment(postId, newComment, currentUser.id, currentUser.department);
    if (!persisted) {
      setSparkToast({ show: true, message: 'Comment could not be saved. Please try again.' });
      return false;
    }
    setGossipPosts((prev) => prev.map((post) => post.id === postId
      ? { ...post, comments: [...post.comments, newComment] }
      : post));
    return true;
  };

  const likeGossipComment = async (postId: string, commentId: string): Promise<boolean> => {
    if (!requestAuthentication()) return false;
    const result = await supabaseService.toggleGossipCommentLike(commentId);
    if (!result) {
      setSparkToast({ show: true, message: 'Comment reaction could not be saved. Please try again.' });
      return false;
    }
    setGossipPosts((prev) => prev.map((post) => post.id === postId
      ? {
          ...post,
          comments: post.comments.map((comment) => comment.id === commentId
            ? { ...comment, likes: result.likes, userLiked: result.userLiked }
            : comment),
        }
      : post));
    return true;
  };

  const reportGossipPost = async (postId: string): Promise<boolean> => {
    if (!requestAuthentication()) return false;
    const persisted = await supabaseService.reportGossipPost(postId);
    setSparkToast({
      show: true,
      message: persisted ? 'Gossip post flagged for campus moderation review. 🛡️' : 'Gossip post flag could not be saved. Please try again.',
    });
    setTimeout(() => setSparkToast(null), 3500);
    return persisted;
  };

  // Vibe chip filter
  const [selectedVibeFilter, setSelectedVibeFilter] = useState<string>('all');

  // Direct Spark Message Toast
  const [sparkToast, setSparkToast] = useState<{ show: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !currentUser.id || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') !== 'callback') return;

    const reference = params.get('reference') || params.get('trxref');
    const cleanUrl = `${window.location.pathname}${window.location.hash}`;
    window.history.replaceState({}, '', cleanUrl || '/');
    if (!reference) {
      setSparkToast({ show: true, message: 'Payment callback received without a transaction reference.' });
      setTimeout(() => setSparkToast(null), 5000);
      return;
    }

    let cancelled = false;
    void supabaseService.verifyPaystackTransaction(reference).then(async ({ data, error }) => {
      if (cancelled) return;
      if (data?.paid && (data.planId === 'weekly' || data.planId === 'monthly' || data.planId === 'semester')) {
        await activatePremium(data.planId);
      } else {
        setSparkToast({ show: true, message: error || 'Payment was not verified. Premium access was not activated.' });
        setTimeout(() => setSparkToast(null), 6000);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, currentUser.id]);

  const buildMatchItem = (profile: UserProfile, matchId: string): MatchItem => ({
    id: matchId,
    matchedUser: profile,
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    hasUnread: true,
    lastMessage: 'You matched! Say hello before the 7-day timer expires 🔥',
    lastMessageTime: Date.now(),
    isLowkeyMatch: currentMode === 'lowkey' || profile.mode === 'lowkey',
  });

  const sendDirectSpark = async (profile: UserProfile, text: string): Promise<boolean> => {
    if (!requestAuthentication() || !currentUser.id || !text.trim()) return false;

    const existingMatch = matches.find((m) => m.matchedUser.id === profile.id);
    let matchId = existingMatch?.id;

    if (!existingMatch) {
      const likeResult = await supabaseService.recordProfileLike(profile.id, 'like');
      if (!likeResult) {
        setSparkToast({ show: true, message: 'Your Spark could not be sent. Please try again.' });
        return false;
      }
      if (!likeResult.matched || !likeResult.matchId) {
        setSparkToast({ show: true, message: `Like sent to ${profile.name.split(' ')[0]}. They can match you back.` });
        setTimeout(() => setSparkToast(null), 4000);
        return true;
      }
      matchId = likeResult.matchId;
      const newMatch = buildMatchItem(profile, matchId);
      setMatches((prev) => [newMatch, ...prev.filter((match) => match.id !== matchId)]);
      setRecentMatch(profile);
    }

    const sent = await sendMessage(matchId!, text);
    if (!sent) return false;

    setSparkToast({
      show: true,
      message: `Spark sent to ${profile.name.split(' ')[0]}! ⚡`,
    });
    confetti({
      particleCount: 55,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ec4899', '#a855f7', '#38bdf8'],
    });
    setTimeout(() => {
      setSparkToast(null);
    }, 4000);
    return true;
  };

  // Update current user
  const updateCurrentUser = (updates: Partial<UserProfile>) => {
    setCurrentUser((prev) => ({ ...prev, ...updates }));
  };

  // Toggle Normal / Lowkey Mode
  const toggleAppMode = async (mode?: AppMode): Promise<boolean> => {
    const nextMode = mode || (currentMode === 'normal' ? 'lowkey' : 'normal');

    if (isAuthenticated && currentUser.id && isSupabaseConfigured()) {
      const persisted = await supabaseService.upsertProfile({ ...currentUser, mode: nextMode });
      if (!persisted) {
        setSparkToast({ show: true, message: 'Campus mode could not be saved. Please try again.' });
        setTimeout(() => setSparkToast(null), 3500);
        return false;
      }
    }

    setCurrentMode(nextMode);
    updateCurrentUser({ mode: nextMode });
    return true;
  };

  // Reset Filters
  const resetFilters = () => {
    setFilters({
      gender: 'all',
      mode: 'all',
      faculty: 'all',
      department: 'all',
      level: 'all',
      onlyMyFaculty: false,
      onlyMyDepartment: false,
      onlyVerified: false,
      searchQuery: '',
    });
  };

  // Confetti trigger
  const fireMatchConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#d946ef', '#c084fc', '#f472b6', '#ffffff'],
    });
  };

  // Swipe Right (Like)
  const swipeRight = async (profile: UserProfile): Promise<void> => {
    if (!requestAuthentication() || !currentUser.id) return;
    setSwipedProfileIds((prev) => [...prev, profile.id]);
    setLastSwipedId(profile.id);

    const likeResult = await supabaseService.recordProfileLike(profile.id, 'like');
    if (!likeResult) {
      setSwipedProfileIds((prev) => prev.filter((id) => id !== profile.id));
      setLastSwipedId((previousId) => (previousId === profile.id ? null : previousId));
      setSparkToast({ show: true, message: 'Your like could not be saved. The profile is available again.' });
      setTimeout(() => setSparkToast(null), 4000);
      return;
    }

    if (!likeResult.matched || !likeResult.matchId) {
      setSparkToast({ show: true, message: 'Like sent. You will see a match when they like you back.' });
      setTimeout(() => setSparkToast(null), 4000);
      return;
    }

    const newMatch = buildMatchItem(profile, likeResult.matchId);
    setMatches((prev) => [newMatch, ...prev.filter((match) => match.id !== newMatch.id)]);
    setRecentMatch(profile);
    fireMatchConfetti();
  };

  // Swipe Left (Pass)
  const swipeLeft = (profile: UserProfile) => {
    if (!requestAuthentication()) return;
    setSwipedProfileIds((prev) => [...prev, profile.id]);
    setLastSwipedId(profile.id);
  };

  // Super Like records stronger interest; it does not create a match without reciprocal interest.
  const superLike = async (profile: UserProfile): Promise<void> => {
    if (!requestAuthentication() || !currentUser.id) return;
    setSwipedProfileIds((prev) => [...prev, profile.id]);
    setLastSwipedId(profile.id);

    const likeResult = await supabaseService.recordProfileLike(profile.id, 'super_like');
    if (!likeResult) {
      setSwipedProfileIds((prev) => prev.filter((id) => id !== profile.id));
      setLastSwipedId((previousId) => (previousId === profile.id ? null : previousId));
      setSparkToast({ show: true, message: 'Your Super Like could not be saved. The profile is available again.' });
      setTimeout(() => setSparkToast(null), 4000);
      return;
    }

    if (!likeResult.matched || !likeResult.matchId) {
      setSparkToast({ show: true, message: 'Super Like sent. A match appears when they like you back.' });
      setTimeout(() => setSparkToast(null), 4000);
      return;
    }

    const newMatch = buildMatchItem(profile, likeResult.matchId);
    setMatches((prev) => [newMatch, ...prev.filter((match) => match.id !== newMatch.id)]);
    setRecentMatch(profile);
    fireMatchConfetti();
  };

  // Rewind last swipe and remove the corresponding persisted like when one exists.
  const rewindLastSwipe = async (): Promise<boolean> => {
    if (!lastSwipedId) return false;

    const rewoundId = lastSwipedId;
    const removed = await supabaseService.removeProfileLike(rewoundId);
    if (!removed) {
      setSparkToast({ show: true, message: 'Rewind could not be saved. Please try again.' });
      setTimeout(() => setSparkToast(null), 3500);
      return false;
    }

    setSwipedProfileIds((prev) => prev.filter((id) => id !== rewoundId));
    setLastSwipedId(null);
    return true;
  };

  const canRewind = Boolean(lastSwipedId);

  // Send message and only publish it to local chat after Supabase confirms persistence.
  const sendMessage = async (
    matchId: string,
    text: string,
    imageUrl?: string,
    isPhotoViewOnce?: boolean,
  ): Promise<boolean> => {
    if (!isAuthenticated || !currentUser.id || (!text.trim() && !imageUrl)) return false;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      matchId,
      senderId: currentUser.id,
      text: text.trim(),
      imageUrl,
      isPhotoViewOnce,
      createdAt: Date.now(),
      read: true,
    };

    const saved = await supabaseService.sendMessage(newMsg);
    if (!saved) {
      setSparkToast({ show: true, message: 'Message could not be saved. Please try again.' });
      setTimeout(() => setSparkToast(null), 4500);
      return false;
    }

    setMessages((prev) => ({
      ...prev,
      [matchId]: [...(prev[matchId] || []), newMsg],
    }));

    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? {
              ...m,
              lastMessage: imageUrl ? (isPhotoViewOnce ? '📸 View-once photo' : '📷 Photo') : text,
              lastMessageTime: Date.now(),
              hasUnread: false,
            }
          : m,
      ),
    );
    return true;
  };

  // Submit Report
  const submitReport = async (targetUser: UserProfile, reason: UserReport['reason'], details: string): Promise<boolean> => {
    if (!isAuthenticated || !currentUser.id) return false;
    const newReport: UserReport = {
      id: `rep_${Date.now()}`,
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      targetUserId: targetUser.id,
      targetUserName: targetUser.name,
      targetUsername: targetUser.username,
      targetPhoto: targetUser.photos[0] || '',
      reason,
      details,
      status: 'pending',
      createdAt: Date.now(),
    };

    const persisted = await supabaseService.submitReport(newReport);
    if (!persisted) {
      setSparkToast({ show: true, message: 'Report could not be saved. Please try again.' });
      return false;
    }
    setReports((prev) => [newReport, ...prev]);
    return true;
  };

  // Block user
  const blockUser = async (userId: string): Promise<void> => {
    if (!isAuthenticated || !currentUser.id) return;
    const persisted = await supabaseService.blockUser(userId);
    if (!persisted) {
      setSparkToast({ show: true, message: 'Block could not be saved. Please try again.' });
      return;
    }
    setBlockedUserIds((prev) => Array.from(new Set([...prev, userId])));
    setProfiles((prev) => prev.filter((p) => p.id !== userId));
    setMatches((prev) => prev.filter((m) => m.matchedUser.id !== userId));
    setSwipedProfileIds((prev) => [...prev, userId]);
    if (currentChatMatch && currentChatMatch.matchedUser.id === userId) setCurrentChatMatch(null);
  };

  // Unmatch user
  const unmatchUser = async (matchId: string): Promise<void> => {
    const persisted = await supabaseService.deleteMatch(matchId);
    if (!persisted) {
      setSparkToast({ show: true, message: 'Unmatch could not be saved. Please try again.' });
      return;
    }
    setMatches((prev) => prev.filter((m) => m.id !== matchId));
    if (currentChatMatch && currentChatMatch.id === matchId) setCurrentChatMatch(null);
  };

  // Submit Photo Verification
  const submitVerification = async (selfieUrl: string, idCardUrl?: string): Promise<boolean> => {
    if (!isAuthenticated || !currentUser.id) return false;
    const newReq: VerificationRequest = {
      id: `ver_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      username: currentUser.username,
      faculty: currentUser.faculty,
      department: currentUser.department,
      profilePhoto: currentUser.photos[0] || '',
      liveSelfiePhoto: selfieUrl,
      studentIdPhoto: idCardUrl,
      submittedAt: Date.now(),
      status: 'pending',
    };

    const persisted = await supabaseService.submitVerification(newReq);
    if (!persisted) {
      setSparkToast({ show: true, message: 'Verification could not be submitted. Please try again.' });
      return false;
    }
    setVerificationRequests((prev) => [newReq, ...prev]);
    updateCurrentUser({
      verificationStatus: 'pending',
      selfieUrl,
      studentIdCardUrl: idCardUrl,
    });
    return true;
  };

  // Admin: Approve Verification
  const approveVerification = async (requestId: string): Promise<boolean> => {
    if (!adminProof) return false;
    const req = verificationRequests.find((r) => r.id === requestId);
    if (!req) return false;

    const persisted = await supabaseService.updateAdminVerification(adminProof, requestId, 'approved');
    if (!persisted) {
      setSparkToast({ show: true, message: 'Verification approval could not be saved. Please try again.' });
      setTimeout(() => setSparkToast(null), 3500);
      return false;
    }

    setVerificationRequests((prev) =>
      prev.map((item) => (item.id === requestId ? { ...item, status: 'approved' } : item))
    );
    if (req.userId === currentUser.id) {
      updateCurrentUser({
        isVerified: true,
        verificationStatus: 'verified',
        badges: Array.from(new Set([...currentUser.badges, '🛡️ Verified Student'])),
      });
    } else {
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === req.userId
            ? {
                ...p,
                isVerified: true,
                verificationStatus: 'verified',
                badges: Array.from(new Set([...p.badges, '🛡️ Verified Student'])),
              }
            : p
        )
      );
    }
    return true;
  };

  // Admin: Reject Verification
  const rejectVerification = async (requestId: string, note?: string): Promise<boolean> => {
    if (!adminProof) return false;
    const adminNote = note || 'Photo mismatch or unclear selfie.';
    const req = verificationRequests.find((r) => r.id === requestId);
    if (!req) return false;

    const persisted = await supabaseService.updateAdminVerification(adminProof, requestId, 'rejected', adminNote);
    if (!persisted) {
      setSparkToast({ show: true, message: 'Verification rejection could not be saved. Please try again.' });
      setTimeout(() => setSparkToast(null), 3500);
      return false;
    }

    setVerificationRequests((prev) =>
      prev.map((item) =>
        item.id === requestId ? { ...item, status: 'rejected', adminNote } : item
      )
    );
    if (req.userId === currentUser.id) {
      updateCurrentUser({
        isVerified: false,
        verificationStatus: 'rejected',
      });
    } else {
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === req.userId
            ? { ...p, isVerified: false, verificationStatus: 'rejected' }
            : p
        )
      );
    }
    return true;
  };

  // Admin: Resolve Report
  const resolveReport = async (reportId: string, action: 'ban' | 'dismiss'): Promise<void> => {
    if (!adminProof) return;
    const persisted = await supabaseService.updateAdminReport(adminProof, reportId, action);
    if (!persisted) {
      setSparkToast({ show: true, message: 'Report moderation could not be saved. Please try again.' });
      return;
    }
    setReports((prev) => prev.map((report) => report.id === reportId
      ? { ...report, status: action === 'ban' ? 'banned' : 'resolved' }
      : report));
    const report = reports.find((item) => item.id === reportId);
    if (report && action === 'ban') {
      setProfiles((prev) => prev.map((profile) => profile.id === report.targetUserId ? { ...profile, isBanned: true } : profile));
      setMatches((prev) => prev.filter((match) => match.matchedUser.id !== report.targetUserId));
    }
  };

  // Admin: Ban User
  const banUser = async (userId: string): Promise<void> => {
    if (!adminProof) return;
    const persisted = await supabaseService.updateAdminProfileBan(adminProof, userId, true);
    if (!persisted) {
      setSparkToast({ show: true, message: 'Account suspension could not be saved. Please try again.' });
      return;
    }
    setProfiles((prev) => prev.map((p) => p.id === userId ? { ...p, isBanned: true } : p));
    setMatches((prev) => prev.filter((m) => m.matchedUser.id !== userId));
    setSwipedProfileIds((prev) => [...prev, userId]);
    if (currentChatMatch && currentChatMatch.matchedUser.id === userId) setCurrentChatMatch(null);
  };

  // Admin: Unban User
  const unbanUser = async (userId: string): Promise<void> => {
    if (!adminProof) return;
    const persisted = await supabaseService.updateAdminProfileBan(adminProof, userId, false);
    if (!persisted) {
      setSparkToast({ show: true, message: 'Account restoration could not be saved. Please try again.' });
      return;
    }
    setProfiles((prev) => prev.map((p) => p.id === userId ? { ...p, isBanned: false } : p));
    setSwipedProfileIds((prev) => prev.filter((id) => id !== userId));
  };

  // Admin: Toggle Direct Verification Badge
  const toggleUserVerification = async (userId: string): Promise<boolean> => {
    const profile = userId === currentUser.id ? currentUser : profiles.find((p) => p.id === userId);
    if (!profile || !adminProof) return false;

    const nextState = !profile.isVerified;
    const persisted = await supabaseService.updateAdminProfileVerification(adminProof, userId, nextState);
    if (!persisted) {
      setSparkToast({ show: true, message: 'Verification badge change could not be saved. Please try again.' });
      setTimeout(() => setSparkToast(null), 3500);
      return false;
    }

    if (userId === currentUser.id) {
      updateCurrentUser({
        isVerified: nextState,
        verificationStatus: nextState ? 'verified' : 'unverified',
        badges: nextState
          ? Array.from(new Set([...currentUser.badges, '🛡️ Verified Student']))
          : currentUser.badges.filter((b) => !b.includes('Verified')),
      });
    } else {
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === userId
            ? {
                ...p,
                isVerified: nextState,
                verificationStatus: nextState ? 'verified' : 'unverified',
                badges: nextState
                  ? Array.from(new Set([...p.badges, '🛡️ Verified Student']))
                  : p.badges.filter((b) => !b.includes('Verified')),
              }
            : p
        )
      );
    }

    return true;
  };

  // Admin: Delete Gossip Post
  const deleteGossipPost = async (postId: string): Promise<void> => {
    if (!adminProof) return;
    const persisted = await supabaseService.deleteAdminGossipPost(adminProof, postId);
    if (!persisted) {
      setSparkToast({ show: true, message: 'Gossip deletion could not be saved. Please try again.' });
      return;
    }
    setGossipPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  // Admin: Delete Campus Poll
  const deleteCampusPoll = async (pollId: string): Promise<void> => {
    if (!adminProof) return;
    const persisted = await supabaseService.deleteAdminCampusPoll(adminProof, pollId);
    if (!persisted) {
      setSparkToast({ show: true, message: 'Poll deletion could not be saved. Please try again.' });
      return;
    }
    setCampusPolls((prev) => prev.filter((p) => p.id !== pollId));
    setActivePollIndex(0);
  };

  // Admin announcements are written through the proof-protected server workflow.
  const broadcastCampusAlert = async (headline: string, message: string): Promise<boolean> => {
    if (!adminProof) return false;
    const alert = await supabaseService.createAdminCampusAlert(adminProof, headline, message);
    if (!alert) {
      setSparkToast({ show: true, message: 'Campus announcement could not be published. Please try again.' });
      setTimeout(() => setSparkToast(null), 5000);
      return false;
    }
    setCampusAlerts((prev) => [alert, ...prev].slice(0, 5));
    setSparkToast({ show: true, message: 'Campus announcement published successfully.' });
    setTimeout(() => setSparkToast(null), 3500);
    return true;
  };

  // Admin: Clear browser cache without restoring any demo records.
  const clearLocalCache = () => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    [STORAGE_KEYS.SWIPED_IDS, STORAGE_KEYS.MATCHES, STORAGE_KEYS.MESSAGES, STORAGE_KEYS.REPORTS, STORAGE_KEYS.VERIFICATIONS].forEach(removeScopedStorage);
    localStorage.removeItem('uoa_is_premium_v2');
    localStorage.removeItem('uoa_active_plan_v2');
    localStorage.removeItem('uoa_stories_v2');
    localStorage.removeItem('uoa_campus_polls_v2');
    localStorage.removeItem('uoa_campus_polls_v3');
    localStorage.removeItem('uoa_gossip_board_v3');
    setProfiles([]);
    setSwipedProfileIds([]);
    setMatches([]);
    setMessages({});
    setCurrentChatMatch(null);
    setRecentMatch(null);
    setReports([]);
    setVerificationRequests([]);
    setStories([]);
    setCampusAlerts([]);
    setCampusPolls([]);
    setGossipPosts([]);
    setActivePollIndex(0);
    setSparkToast({
      show: true,
      message: 'Browser cache cleared. Live Supabase data was not changed.',
    });
    setTimeout(() => setSparkToast(null), 3000);
  };

  // Activate Premium only after the server confirms a matching, unexpired entitlement.
  const activatePremium = async (planId: 'weekly' | 'monthly' | 'semester') => {
    if (!currentUser.id) return;
    const entitlement = await supabaseService.fetchPremiumEntitlement(currentUser.id);
    const isValid = Boolean(
      entitlement?.planId === planId &&
      entitlement.status === 'active' &&
      new Date(entitlement.expiresAt).getTime() > Date.now(),
    );

    if (!isValid) {
      applyPremiumEntitlement(entitlement);
      setSparkToast({ show: true, message: 'Payment was recorded, but Premium access is still being confirmed.' });
      setTimeout(() => setSparkToast(null), 5000);
      return;
    }

    applyPremiumEntitlement(entitlement);
    setIsPremiumModalOpen(false);
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#eab308', '#a855f7', '#ec4899', '#ffffff'],
    });
  };

  // Profile Boost
  const triggerBoost = () => {
    if (!requestAuthentication()) return;
    if (isBoostActive) {
      setSparkToast({ show: true, message: 'Your Boost is already active.' });
      setTimeout(() => setSparkToast(null), 3500);
      return;
    }

    void supabaseService.activateProfileBoost().then(({ expiresAt, error }) => {
      if (!expiresAt) {
        const message = error?.includes('boost_already_active')
          ? 'Your Boost is already active.'
          : 'Boost could not be activated. Please try again.';
        setSparkToast({ show: true, message });
        setTimeout(() => setSparkToast(null), 3500);
        return;
      }

      const expiresAtMs = new Date(expiresAt).getTime();
      const remaining = Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000));
      setCurrentUser((prev) => ({ ...prev, boostExpiresAt: expiresAt, isBoosted: true }));
      setIsBoostActive(remaining > 0);
      setBoostTimeLeft(remaining);
      setSparkToast({ show: true, message: 'Boost is live for 30 minutes. Active profiles move to the front of discovery.' });
      setTimeout(() => setSparkToast(null), 4500);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#ff177f', '#ff8b36', '#ffffff'],
      });
    });
  };

  // Inbound likes are hydrated from profile_likes and exclude matched or unavailable profiles.

  return (
    <AppContext.Provider
      value={{
        currentUser,
        updateCurrentUser,
        activeTab,
        setActiveTab,
        isAuthenticated,
        isAuthLoading,
        isEmailVerified,
        authenticateUser,
        signOut,
        refreshAuthentication,
        requestAuthentication,
        isAdminAuthenticated,
        authenticateAdmin,
        logoutAdmin,
        adminMetrics,
        refreshAdminMetrics,
        currentMode,
        toggleAppMode,
        profiles,
        swipedProfileIds,
        swipeRight,
        swipeLeft,
        superLike,
        blockedUserIds,
        rewindLastSwipe,
        canRewind,
        matches,
        currentChatMatch,
        setCurrentChatMatch,
        messages,
        sendMessage,
        filters,
        setFilters,
        resetFilters,
        recentMatch,
        setRecentMatch,
        whoLikedMeProfiles,
        campusAlerts,
        isPremium,
        activePlan,
        activatePremium,
        reports,
        submitReport,
        blockUser,
        unmatchUser,
        verificationRequests,
        submitVerification,
        approveVerification,
        rejectVerification,
        resolveReport,
        banUser,
        unbanUser,
        toggleUserVerification,
        deleteGossipPost,
        deleteCampusPoll,
        broadcastCampusAlert,
        clearLocalCache,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        openAuthModal,
        isVerificationModalOpen,
        setIsVerificationModalOpen,
        isPremiumModalOpen,
        setIsPremiumModalOpen,
        isFiltersModalOpen,
        setIsFiltersModalOpen,
        isProfileEditModalOpen,
        setIsProfileEditModalOpen,
        isBoostActive,
        triggerBoost,
        boostTimeLeft,
        stories,
        activeStory,
        setActiveStory,
        addCampusStory,
        campusPoll,
        campusPolls,
        activePollIndex,
        setActivePollIndex,
        voteCampusPoll,
        addCampusPoll,
        selectedVibeFilter,
        setSelectedVibeFilter,
        sendDirectSpark,
        sparkToast,
        setSparkToast,
        gossipPosts,
        addGossipPost,
        reactToGossipPost,
        addGossipComment,
        likeGossipComment,
        reportGossipPost,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
