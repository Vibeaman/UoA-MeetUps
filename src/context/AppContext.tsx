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
  GossipPost,
  GossipComment,
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
  currentMode: AppMode;
  toggleAppMode: (mode?: AppMode) => void;
  profiles: UserProfile[];
  swipedProfileIds: string[];
  swipeRight: (profile: UserProfile) => boolean; // returns true if match created
  swipeLeft: (profile: UserProfile) => void;
  superLike: (profile: UserProfile) => void;
  rewindLastSwipe: () => boolean;
  canRewind: boolean;
  matches: MatchItem[];
  currentChatMatch: MatchItem | null;
  setCurrentChatMatch: (match: MatchItem | null) => void;
  messages: Record<string, ChatMessage[]>;
  sendMessage: (matchId: string, text: string, imageUrl?: string, isPhotoViewOnce?: boolean) => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  recentMatch: UserProfile | null;
  setRecentMatch: (profile: UserProfile | null) => void;
  whoLikedMeProfiles: UserProfile[];
  isPremium: boolean;
  setIsPremium: (status: boolean) => void;
  activePlan: string | null;
  activatePremium: (planId: 'weekly' | 'monthly' | 'semester') => void;
  reports: UserReport[];
  submitReport: (targetUser: UserProfile, reason: UserReport['reason'], details: string) => void;
  blockUser: (userId: string) => void;
  unmatchUser: (matchId: string) => void;
  verificationRequests: VerificationRequest[];
  submitVerification: (selfieUrl: string, idCardUrl?: string) => void;
  // Admin actions
  approveVerification: (requestId: string) => void;
  rejectVerification: (requestId: string, note?: string) => void;
  resolveReport: (reportId: string, action: 'ban' | 'dismiss') => void;
  banUser: (userId: string) => void;
  unbanUser: (userId: string) => void;
  toggleUserVerification: (userId: string) => void;
  deleteGossipPost: (postId: string) => void;
  deleteCampusPoll: (pollId: string) => void;
  broadcastCampusAlert: (headline: string, message: string) => void;
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
  voteCampusPoll: (pollId: string, optionId: string) => void;
  addCampusPoll: (question: string, category: string, options: string[]) => void;
  selectedVibeFilter: string;
  setSelectedVibeFilter: (vibe: string) => void;
  sendDirectSpark: (profile: UserProfile, text: string) => void;
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
  ) => void;
  reactToGossipPost: (postId: string, reactionType: 'spicy' | 'cap' | 'facts' | 'tea') => void;
  addGossipComment: (postId: string, content: string, isAnonymous: boolean) => void;
  likeGossipComment: (postId: string, commentId: string) => void;
  reportGossipPost: (postId: string) => void;
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
  IS_PREMIUM: 'uoa_is_premium_v2',
  ACTIVE_PLAN: 'uoa_active_plan_v2',
  IS_AUTHENTICATED: 'uoa_is_authenticated_v1',
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
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return saved ? JSON.parse(saved) : EMPTY_CURRENT_USER;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<NavigationTab>(() => {
    const pathname = typeof window !== 'undefined' ? window.location.pathname.replace(/\/+$/, '') || '/' : '/';
    return pathname === '/admin' ? 'admin' : 'discover';
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [currentMode, setCurrentMode] = useState<AppMode>(currentUser.mode || 'normal');

  const authenticateAdmin = async (password: string) => {
    try {
      const { data, error } = await getSupabase().functions.invoke('admin-auth', {
        body: { password: password.trim().toUpperCase() },
      });

      if (error || !data?.authenticated) {
        setIsAdminAuthenticated(false);
        return false;
      }

      setIsAdminAuthenticated(true);
      return true;
    } catch (error) {
      console.warn(`Admin authorization request failed for ${SUPABASE_URL_DISPLAY}:`, error);
      setIsAdminAuthenticated(false);
      return false;
    }
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
  };

  // Profiles
  const [profiles, setProfiles] = useState<UserProfile[]>([]);

  const [swipedProfileIds, setSwipedProfileIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SWIPED_IDS);
    return saved ? JSON.parse(saved) : [];
  });

  const [lastSwipedId, setLastSwipedId] = useState<string | null>(null);

  // Matches (7 days expiration timestamp = 7 * 24 * 60 * 60 * 1000)
  const [matches, setMatches] = useState<MatchItem[]>([]);

  // Messages per matchId
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});

  const [currentChatMatch, setCurrentChatMatch] = useState<MatchItem | null>(null);
  const [recentMatch, setRecentMatch] = useState<UserProfile | null>(null);

  // Premium State
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IS_PREMIUM);
    return saved ? JSON.parse(saved) : false;
  });

  const [activePlan, setActivePlan] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_PLAN) || null;
  });

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
    localStorage.removeItem(STORAGE_KEYS.IS_AUTHENTICATED);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
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

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.IS_AUTHENTICATED);
    }
  }, [isAuthenticated]);

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
    if (!isAuthenticated || !currentUser.id || !isSupabaseConfigured()) return;
    let cancelled = false;
    void supabaseService.fetchProfile(currentUser.id).then((profile) => {
      if (!cancelled && profile) setCurrentUser(profile);
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
    localStorage.setItem(STORAGE_KEYS.SWIPED_IDS, JSON.stringify(swipedProfileIds));
  }, [swipedProfileIds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VERIFICATIONS, JSON.stringify(verificationRequests));
  }, [verificationRequests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IS_PREMIUM, JSON.stringify(isPremium));
  }, [isPremium]);

  useEffect(() => {
    if (activePlan) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PLAN, activePlan);
    }
  }, [activePlan]);

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

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    void supabaseService.fetchCampusStories().then((remoteStories) => {
      if (!cancelled && remoteStories) setStories(remoteStories);
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

  const voteCampusPoll = (pollId: string, optionId: string) => {
    if (!requestAuthentication()) return;

    const existingPoll = campusPolls.find((poll) => poll.id === pollId);
    if (!existingPoll || existingPoll.userVotedOptionId === optionId) return;

    const hadPrevious = !!existingPoll.userVotedOptionId;
    const updatedPoll: CampusPoll = {
      ...existingPoll,
      totalVotes: hadPrevious ? existingPoll.totalVotes : existingPoll.totalVotes + 1,
      options: existingPoll.options.map((opt) => {
        if (opt.id === optionId) return { ...opt, votes: opt.votes + 1 };
        if (hadPrevious && opt.id === existingPoll.userVotedOptionId) {
          return { ...opt, votes: Math.max(0, opt.votes - 1) };
        }
        return opt;
      }),
      userVotedOptionId: optionId,
    };

    setCampusPolls((prevPolls) => prevPolls.map((poll) => (poll.id === pollId ? updatedPoll : poll)));
    void supabaseService.voteCampusPoll(pollId, optionId).then((remotePoll) => {
      if (!remotePoll) return;
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
    });

    confetti({
      particleCount: 35,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#a855f7', '#ec4899', '#f43f5e', '#38bdf8'],
    });
  };

  const addCampusPoll = (question: string, category: string, options: string[]) => {
    if (!requestAuthentication()) return;

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
    setCampusPolls((prev) => [newPoll, ...prev]);
    setActivePollIndex(0);
    void supabaseService.upsertCampusPoll(newPoll);
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  // Gossip Board State (live Supabase rows only)
  const [gossipPosts, setGossipPosts] = useState<GossipPost[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    void supabaseService.fetchGossipPosts().then((remotePosts) => {
      if (!cancelled && remotePosts) {
        setGossipPosts(remotePosts);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const addGossipPost = (
    content: string,
    tag: string,
    isAnonymous: boolean,
    anonymousAlias?: string,
    imageUrl?: string
  ) => {
    if (!requestAuthentication()) return;

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

    setGossipPosts((prev) => [newPost, ...prev]);
    void supabaseService.createGossipPost(newPost);
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#ec4899', '#f97316', '#fbbf24'],
    });
  };

  const reactToGossipPost = (postId: string, reactionType: 'spicy' | 'cap' | 'facts' | 'tea') => {
    if (!requestAuthentication()) return;

    const existingPost = gossipPosts.find((post) => post.id === postId);
    if (!existingPost) return;

    const currentReaction = existingPost.userReaction;
    const counts = {
      spicy: existingPost.spicyCount,
      cap: existingPost.capCount,
      facts: existingPost.factsCount,
      tea: existingPost.teaCount,
    };

    if (currentReaction) {
      counts[currentReaction] = Math.max(0, counts[currentReaction] - 1);
    }

    const nextReaction = currentReaction === reactionType ? undefined : reactionType;
    if (nextReaction) {
      counts[nextReaction] += 1;
    }

    const updatedPost: GossipPost = {
      ...existingPost,
      spicyCount: counts.spicy,
      capCount: counts.cap,
      factsCount: counts.facts,
      teaCount: counts.tea,
      userReaction: nextReaction,
    };

    setGossipPosts((prev) => prev.map((post) => (post.id === postId ? updatedPost : post)));
    void supabaseService.reactToGossipPost(postId, reactionType).then((remoteReaction) => {
      if (!remoteReaction) return;
      setGossipPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                ...remoteReaction,
              }
            : post
        )
      );
    });
  };

  const addGossipComment = (postId: string, content: string, isAnonymous: boolean) => {
    if (!requestAuthentication()) return;

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

    setGossipPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          comments: [...post.comments, newComment],
        };
      })
    );
    void supabaseService.createGossipComment(postId, newComment, currentUser.id, currentUser.department);
  };

  const likeGossipComment = (postId: string, commentId: string) => {
    if (!requestAuthentication()) return;

    setGossipPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          comments: post.comments.map((c) => {
            if (c.id !== commentId) return c;
            const isLiked = !!c.userLiked;
            return {
              ...c,
              likes: isLiked ? Math.max(0, c.likes - 1) : c.likes + 1,
              userLiked: !isLiked,
            };
          }),
        };
      })
    );
  };

  const reportGossipPost = (postId: string) => {
    if (!requestAuthentication()) return;

    setSparkToast({
      show: true,
      message: 'Gossip post flagged for campus moderation review. 🛡️',
    });
    setTimeout(() => setSparkToast(null), 3500);
  };

  // Vibe chip filter
  const [selectedVibeFilter, setSelectedVibeFilter] = useState<string>('all');

  // Direct Spark Message Toast
  const [sparkToast, setSparkToast] = useState<{ show: boolean; message: string } | null>(null);

  const sendDirectSpark = (profile: UserProfile, text: string) => {
    const existingMatch = matches.find((m) => m.matchedUser.id === profile.id);
    let matchId = existingMatch?.id;

    if (!existingMatch) {
      matchId = `match_${Date.now()}`;
      const newMatch: MatchItem = {
        id: matchId,
        matchedUser: profile,
        createdAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        lastMessage: text,
        lastMessageTime: Date.now(),
        hasUnread: false,
        isLowkeyMatch: currentMode === 'lowkey' || profile.mode === 'lowkey',
      };
      setMatches((prev) => [newMatch, ...prev]);
    }

    const msgId = `msg_${Date.now()}`;
    const newMsg: ChatMessage = {
      id: msgId,
      matchId: matchId!,
      senderId: currentUser.id,
      text: text,
      createdAt: Date.now(),
      read: true,
    };
    setMessages((prev) => ({
      ...prev,
      [matchId!]: [...(prev[matchId!] || []), newMsg],
    }));

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
  };

  // Update current user
  const updateCurrentUser = (updates: Partial<UserProfile>) => {
    setCurrentUser((prev) => ({ ...prev, ...updates }));
  };

  // Toggle Normal / Lowkey Mode
  const toggleAppMode = (mode?: AppMode) => {
    const nextMode = mode || (currentMode === 'normal' ? 'lowkey' : 'normal');
    setCurrentMode(nextMode);
    updateCurrentUser({ mode: nextMode });
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
  const swipeRight = (profile: UserProfile): boolean => {
    setSwipedProfileIds((prev) => [...prev, profile.id]);
    setLastSwipedId(profile.id);

    // Simulated high match probability for immersive experience
    const willMatch = profile.lookingFor === 'both' || profile.lookingFor === currentUser.lookingFor || Math.random() > 0.3;

    if (willMatch) {
      const newMatch: MatchItem = {
        id: `match_${Date.now()}_${profile.id}`,
        matchedUser: profile,
        createdAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        hasUnread: true,
        lastMessage: 'You matched! Say hello before the 7-day timer expires 🔥',
        lastMessageTime: Date.now(),
        isLowkeyMatch: currentMode === 'lowkey' || profile.mode === 'lowkey',
      };

      setMatches((prev) => [newMatch, ...prev.filter((m) => m.matchedUser.id !== profile.id)]);
      setRecentMatch(profile);
      fireMatchConfetti();
      return true;
    }

    return false;
  };

  // Swipe Left (Pass)
  const swipeLeft = (profile: UserProfile) => {
    setSwipedProfileIds((prev) => [...prev, profile.id]);
    setLastSwipedId(profile.id);
  };

  // Super Like
  const superLike = (profile: UserProfile) => {
    setSwipedProfileIds((prev) => [...prev, profile.id]);
    setLastSwipedId(profile.id);

    const newMatch: MatchItem = {
      id: `match_super_${Date.now()}_${profile.id}`,
      matchedUser: profile,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      hasUnread: true,
      lastMessage: `⭐ Super Liked! You both connected instantly!`,
      lastMessageTime: Date.now(),
      isLowkeyMatch: currentMode === 'lowkey' || profile.mode === 'lowkey',
    };

    setMatches((prev) => [newMatch, ...prev.filter((m) => m.matchedUser.id !== profile.id)]);
    setRecentMatch(profile);
    fireMatchConfetti();
  };

  // Rewind last swipe
  const rewindLastSwipe = (): boolean => {
    if (!lastSwipedId) return false;
    setSwipedProfileIds((prev) => prev.filter((id) => id !== lastSwipedId));
    setLastSwipedId(null);
    return true;
  };

  const canRewind = Boolean(lastSwipedId);

  // Send message
  const sendMessage = (matchId: string, text: string, imageUrl?: string, isPhotoViewOnce?: boolean) => {
    if (!text.trim() && !imageUrl) return;

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

    setMessages((prev) => ({
      ...prev,
      [matchId]: [...(prev[matchId] || []), newMsg],
    }));

    // Update the local preview and persist the real message remotely.
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? {
              ...m,
              lastMessage: imageUrl ? (isPhotoViewOnce ? '📸 View-once photo' : '📷 Photo') : text,
              lastMessageTime: Date.now(),
              hasUnread: false,
            }
          : m
      )
    );
    void supabaseService.sendMessage(newMsg);
  };

  // Submit Report
  const submitReport = (targetUser: UserProfile, reason: UserReport['reason'], details: string) => {
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

    setReports((prev) => [newReport, ...prev]);
    void supabaseService.submitReport(newReport);
  };

  // Block user
  const blockUser = (userId: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== userId));
    setMatches((prev) => prev.filter((m) => m.matchedUser.id !== userId));
    setSwipedProfileIds((prev) => [...prev, userId]);
    if (currentChatMatch && currentChatMatch.matchedUser.id === userId) {
      setCurrentChatMatch(null);
    }
  };

  // Unmatch user
  const unmatchUser = (matchId: string) => {
    setMatches((prev) => prev.filter((m) => m.id !== matchId));
    if (currentChatMatch && currentChatMatch.id === matchId) {
      setCurrentChatMatch(null);
    }
  };

  // Submit Photo Verification
  const submitVerification = (selfieUrl: string, idCardUrl?: string) => {
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

    setVerificationRequests((prev) => [newReq, ...prev]);
    void supabaseService.submitVerification(newReq);
    updateCurrentUser({
      verificationStatus: 'pending',
      selfieUrl,
      studentIdCardUrl: idCardUrl,
    });
  };

  // Admin: Approve Verification
  const approveVerification = (requestId: string) => {
    setVerificationRequests((prev) =>
      prev.map((req) => (req.id === requestId ? { ...req, status: 'approved' } : req))
    );

    const req = verificationRequests.find((r) => r.id === requestId);
    if (req && req.userId === currentUser.id) {
      updateCurrentUser({
        isVerified: true,
        verificationStatus: 'verified',
        badges: Array.from(new Set([...currentUser.badges, '🛡️ Verified Student'])),
      });
    } else if (req) {
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
  };

  // Admin: Reject Verification
  const rejectVerification = (requestId: string, note?: string) => {
    setVerificationRequests((prev) =>
      prev.map((req) =>
        req.id === requestId ? { ...req, status: 'rejected', adminNote: note || 'Photo mismatch or unclear selfie.' } : req
      )
    );

    const req = verificationRequests.find((r) => r.id === requestId);
    if (req && req.userId === currentUser.id) {
      updateCurrentUser({
        isVerified: false,
        verificationStatus: 'rejected',
      });
    }
  };

  // Admin: Resolve Report
  const resolveReport = (reportId: string, action: 'ban' | 'dismiss') => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === reportId) {
          return {
            ...r,
            status: action === 'ban' ? 'banned' : 'resolved',
          };
        }
        return r;
      })
    );

    const rep = reports.find((r) => r.id === reportId);
    if (rep && action === 'ban') {
      banUser(rep.targetUserId);
    }
  };

  // Admin: Ban User
  const banUser = (userId: string) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === userId ? { ...p, isBanned: true } : p))
    );
    setMatches((prev) => prev.filter((m) => m.matchedUser.id !== userId));
    setSwipedProfileIds((prev) => [...prev, userId]);
    if (currentChatMatch && currentChatMatch.matchedUser.id === userId) {
      setCurrentChatMatch(null);
    }
  };

  // Admin: Unban User
  const unbanUser = (userId: string) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === userId ? { ...p, isBanned: false } : p))
    );
    setSwipedProfileIds((prev) => prev.filter((id) => id !== userId));
  };

  // Admin: Toggle Direct Verification Badge
  const toggleUserVerification = (userId: string) => {
    if (userId === currentUser.id) {
      const nextState = !currentUser.isVerified;
      updateCurrentUser({
        isVerified: nextState,
        verificationStatus: nextState ? 'verified' : 'unverified',
        badges: nextState
          ? Array.from(new Set([...currentUser.badges, '🛡️ Verified Student']))
          : currentUser.badges.filter((b) => !b.includes('Verified')),
      });
    } else {
      setProfiles((prev) =>
        prev.map((p) => {
          if (p.id !== userId) return p;
          const nextState = !p.isVerified;
          return {
            ...p,
            isVerified: nextState,
            verificationStatus: nextState ? 'verified' : 'unverified',
            badges: nextState
              ? Array.from(new Set([...p.badges, '🛡️ Verified Student']))
              : p.badges.filter((b) => !b.includes('Verified')),
          };
        })
      );
    }
  };

  // Admin: Delete Gossip Post
  const deleteGossipPost = (postId: string) => {
    setGossipPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  // Admin: Delete Campus Poll
  const deleteCampusPoll = (pollId: string) => {
    setCampusPolls((prev) => prev.filter((p) => p.id !== pollId));
    setActivePollIndex(0);
  };

  // Admin announcements must be persisted by a dedicated server-authorized workflow.
  // Do not inject a fabricated local post into the shared feed.
  const broadcastCampusAlert = (headline: string, message: string) => {
    setSparkToast({
      show: true,
      message: `Public announcement unavailable: ${headline}. A server-persisted publishing workflow is required.`,
    });
    setTimeout(() => setSparkToast(null), 6000);
  };

  // Admin: Clear browser cache without restoring any demo records.
  const clearLocalCache = () => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem('uoa_stories_v2');
    localStorage.removeItem('uoa_campus_polls_v2');
    localStorage.removeItem('uoa_campus_polls_v3');
    localStorage.removeItem('uoa_gossip_board_v3');
    setProfiles([]);
    setSwipedProfileIds([]);
    setMatches([]);
    setMessages({});
    setReports([]);
    setVerificationRequests([]);
    setStories([]);
    setCampusPolls([]);
    setGossipPosts([]);
    setActivePollIndex(0);
    setSparkToast({
      show: true,
      message: 'Browser cache cleared. Live Supabase data was not changed.',
    });
    setTimeout(() => setSparkToast(null), 3000);
  };

  // Activate Premium
  const activatePremium = (planId: 'weekly' | 'monthly' | 'semester') => {
    setIsPremium(true);
    setActivePlan(planId);
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

  // Inbound likes are populated from live user actions when that data is available.
  const whoLikedMeProfiles: UserProfile[] = [];

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
        currentMode,
        toggleAppMode,
        profiles,
        swipedProfileIds,
        swipeRight,
        swipeLeft,
        superLike,
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
        isPremium,
        setIsPremium,
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
