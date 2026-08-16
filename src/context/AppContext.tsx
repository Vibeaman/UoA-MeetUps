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
import {
  INITIAL_CURRENT_USER,
  INITIAL_PROFILES,
  INITIAL_REPORTS,
  INITIAL_VERIFICATIONS,
  CAMPUS_STORIES,
  INITIAL_CAMPUS_POLLS,
  INITIAL_GOSSIP_POSTS,
} from '../data/mockData';
import { supabaseService } from '../services/supabaseService';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

interface AppContextType {
  currentUser: UserProfile;
  updateCurrentUser: (updates: Partial<UserProfile>) => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isEmailVerified: boolean;
  authenticateUser: (userId?: string) => void;
  signOut: () => void;
  refreshAuthentication: () => Promise<{ isAuthenticated: boolean; isEmailVerified: boolean; hasSession: boolean; userId?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; message: string }>;
  requestAuthentication: () => boolean;
  isAdminAuthenticated: boolean;
  unlockAdmin: (password: string) => boolean;
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
  resetDemoData: () => void;
  // Modals
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
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
  addCampusStory: (caption: string, tag: string, storyImageUrl?: string) => void;
  campusPoll: CampusPoll;
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

const ADMIN_PASSWORD = 'MJJ';

const STORAGE_KEYS = {
  CURRENT_USER: 'uoa_current_user_v2',
  PROFILES: 'uoa_profiles_v2',
  SWIPED_IDS: 'uoa_swiped_ids_v2',
  MATCHES: 'uoa_matches_v2',
  MESSAGES: 'uoa_messages_v2',
  REPORTS: 'uoa_reports_v2',
  VERIFICATIONS: 'uoa_verifications_v2',
  IS_PREMIUM: 'uoa_is_premium_v2',
  ACTIVE_PLAN: 'uoa_active_plan_v2',
  IS_AUTHENTICATED: 'uoa_is_authenticated_v1',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Current user state
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return saved ? JSON.parse(saved) : INITIAL_CURRENT_USER;
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

  const unlockAdmin = (password: string) => {
    const isValid = password.trim().toUpperCase() === ADMIN_PASSWORD;
    setIsAdminAuthenticated(isValid);
    return isValid;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
  };

  // Profiles
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILES);
    return saved ? JSON.parse(saved) : INITIAL_PROFILES;
  });

  const [swipedProfileIds, setSwipedProfileIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SWIPED_IDS);
    return saved ? JSON.parse(saved) : [];
  });

  const [lastSwipedId, setLastSwipedId] = useState<string | null>(null);

  // Matches (7 days expiration timestamp = 7 * 24 * 60 * 60 * 1000)
  const [matches, setMatches] = useState<MatchItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MATCHES);
    if (saved) {
      return JSON.parse(saved);
    }
    // Initial demo match with Zainab Bello
    const firstMatchUser = INITIAL_PROFILES[0];
    const initialMatch: MatchItem = {
      id: 'match_init_01',
      matchedUser: firstMatchUser,
      createdAt: Date.now() - 3600000 * 12, // 12 hours ago
      expiresAt: Date.now() + 3600000 * 24 * 6.5, // 6.5 days remaining
      lastMessage: 'Hey Tariro! How was your exam today? 😊',
      lastMessageTime: Date.now() - 3600000 * 2,
      hasUnread: true,
      isLowkeyMatch: false,
    };
    return [initialMatch];
  });

  // Messages per matchId
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      match_init_01: [
        {
          id: 'm1',
          matchId: 'match_init_01',
          senderId: 'user_01',
          text: 'Hey Tariro! How was your exam today? 😊',
          createdAt: Date.now() - 3600000 * 2,
          read: false,
        },
      ],
    };
  });

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
  const [reports, setReports] = useState<UserReport[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REPORTS);
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  });

  // Verifications
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VERIFICATIONS);
    return saved ? JSON.parse(saved) : INITIAL_VERIFICATIONS;
  });

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const authenticateUser = (userId?: string) => {
    setIsAuthenticated(true);
    setIsEmailVerified(true);
    if (userId) {
      setCurrentUser((prev) => ({ ...prev, id: userId }));
    }
  };

  const signOut = () => {
    setIsAuthenticated(false);
    setIsEmailVerified(false);
    localStorage.removeItem(STORAGE_KEYS.IS_AUTHENTICATED);
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
      const authenticated = !error && Boolean(user) && verified;

    setIsAuthenticated(authenticated);
    setIsEmailVerified(verified);
    if (authenticated && user) {
      setCurrentUser((prev) => ({ ...prev, id: user.id }));
    }

    return { isAuthenticated: authenticated, isEmailVerified: verified, hasSession: true, userId: user?.id };
  };

  const resendVerificationEmail = async (email: string) => {
    const { error } = await getSupabase().auth.resend({ type: 'signup', email: email.trim().toLowerCase() });
    return error
      ? { success: false, message: error.message }
      : { success: true, message: 'Verification email sent. Check your inbox and spam folder.' };
  };

  const requestAuthentication = () => {
    if (isAuthenticated) return true;
    setIsAuthModalOpen(true);
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
      setIsAuthenticated(Boolean(user) && verified);
      setIsEmailVerified(verified);
      if (user && verified) {
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
      setIsAuthenticated(Boolean(user) && verified);
      setIsEmailVerified(verified);
      if (user && verified) {
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
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
  }, [profiles]);

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

  // Boost timer countdown
  useEffect(() => {
    let interval: any;
    if (isBoostActive && boostTimeLeft > 0) {
      interval = setInterval(() => {
        setBoostTimeLeft((prev) => {
          if (prev <= 1) {
            setIsBoostActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBoostActive, boostTimeLeft]);

  // Stories & Highlights State
  const [stories, setStories] = useState<CampusStory[]>(() => {
    const saved = localStorage.getItem('uoa_stories_v2');
    return saved ? JSON.parse(saved) : CAMPUS_STORIES;
  });
  const [activeStory, setActiveStory] = useState<CampusStory | null>(null);

  useEffect(() => {
    localStorage.setItem('uoa_stories_v2', JSON.stringify(stories));
  }, [stories]);

  const addCampusStory = (caption: string, tag: string, storyImageUrl?: string) => {
    const newStory: CampusStory = {
      id: `story_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name.split(' ')[0],
      avatar: currentUser.photos[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      storyImage: storyImageUrl || currentUser.photos[0],
      caption,
      tag: tag || '✨ Campus Vibe',
      postedAt: 'Just now',
      department: currentUser.department,
      level: currentUser.level,
    };
    setStories((prev) => [newStory, ...prev]);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  // Campus Daily Polls State
  const [campusPolls, setCampusPolls] = useState<CampusPoll[]>(() => {
    const saved = localStorage.getItem('uoa_campus_polls_v3');
    return saved ? JSON.parse(saved) : INITIAL_CAMPUS_POLLS;
  });
  const [activePollIndex, setActivePollIndex] = useState<number>(0);

  const campusPoll = campusPolls[activePollIndex] || campusPolls[0];

  useEffect(() => {
    localStorage.setItem('uoa_campus_polls_v3', JSON.stringify(campusPolls));
  }, [campusPolls]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    void supabaseService.fetchCampusPolls().then((remotePolls) => {
      if (!cancelled && remotePolls && remotePolls.length > 0) {
        setCampusPolls(remotePolls);
      }
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
    void supabaseService.upsertCampusPoll(updatedPoll);

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

  // Gossip Board State
  const [gossipPosts, setGossipPosts] = useState<GossipPost[]>(() => {
    const saved = localStorage.getItem('uoa_gossip_board_v3');
    return saved ? JSON.parse(saved) : INITIAL_GOSSIP_POSTS;
  });

  useEffect(() => {
    localStorage.setItem('uoa_gossip_board_v3', JSON.stringify(gossipPosts));
  }, [gossipPosts]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;
    void supabaseService.fetchGossipPosts().then((remotePosts) => {
      if (!cancelled && remotePosts && remotePosts.length > 0) {
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
      spicyCount: 1,
      capCount: 0,
      factsCount: 0,
      teaCount: 1,
      viewsCount: 1,
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

    setGossipPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const currentReaction = post.userReaction;

        // If clicking the same reaction, toggle off
        if (currentReaction === reactionType) {
          const countKey = `${reactionType}Count` as keyof GossipPost;
          return {
            ...post,
            [countKey]: Math.max(0, (post[countKey] as number) - 1),
            userReaction: undefined,
          };
        }

        // If switching reactions
        let updatedPost = { ...post };
        if (currentReaction) {
          const prevKey = `${currentReaction}Count` as keyof GossipPost;
          updatedPost[prevKey] = Math.max(0, (updatedPost[prevKey] as number) - 1) as never;
        }

        const newKey = `${reactionType}Count` as keyof GossipPost;
        updatedPost[newKey] = ((updatedPost[newKey] as number) + 1) as never;
        updatedPost.userReaction = reactionType;

        return updatedPost;
      })
    );
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

    // Update match preview
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

    // Simulated responsive auto-reply after 2.5 seconds for engaging real-time feel
    setTimeout(() => {
      const match = matches.find((m) => m.id === matchId);
      if (match) {
        const replies = [
          `Hey Tariro! That’s so true haha 😄`,
          `Are you at Giri campus right now or off-campus?`,
          `Love your vibe! Have you had lunch around the arcade?`,
          `Haha totally! Which lecturer do you have tomorrow morning?`,
          `Smooth! Let’s link up near the Senate building plaza later today ✨`,
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];

        const replyMsg: ChatMessage = {
          id: `msg_reply_${Date.now()}`,
          matchId,
          senderId: match.matchedUser.id,
          text: randomReply,
          createdAt: Date.now(),
          read: false,
        };

        setMessages((curr) => ({
          ...curr,
          [matchId]: [...(curr[matchId] || []), replyMsg],
        }));

        setMatches((currMatches) =>
          currMatches.map((m) =>
            m.id === matchId
              ? {
                  ...m,
                  lastMessage: randomReply,
                  lastMessageTime: Date.now(),
                  hasUnread: true,
                }
              : m
          )
        );
      }
    }, 2500);
  };

  // Submit Report
  const submitReport = (targetUser: UserProfile, reason: UserReport['reason'], details: string) => {
    const newReport: UserReport = {
      id: `rep_${Date.now()}`,
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      targetUserId: targetUser.id,
      targetUserName: targetUser.name,
      targetMatric: targetUser.matricNumber,
      targetPhoto: targetUser.photos[0] || '',
      reason,
      details,
      status: 'pending',
      createdAt: Date.now(),
    };

    setReports((prev) => [newReport, ...prev]);
    // Automatically block & remove from swiped/matches
    blockUser(targetUser.id);
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
      matricNumber: currentUser.matricNumber,
      faculty: currentUser.faculty,
      department: currentUser.department,
      profilePhoto: currentUser.photos[0] || '',
      liveSelfiePhoto: selfieUrl,
      studentIdPhoto: idCardUrl,
      submittedAt: Date.now(),
      status: 'pending',
    };

    setVerificationRequests((prev) => [newReq, ...prev]);
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
    setCampusPolls((prev) => {
      const remaining = prev.filter((p) => p.id !== pollId);
      return remaining.length > 0 ? remaining : INITIAL_CAMPUS_POLLS;
    });
    setActivePollIndex(0);
  };

  // Admin: Broadcast Campus Alert Announcement
  const broadcastCampusAlert = (headline: string, message: string) => {
    setSparkToast({
      show: true,
      message: `📢 [CAMPUS BROADCAST] ${headline}: ${message}`,
    });

    const adminAnnouncement: GossipPost = {
      id: `gossip_broadcast_${Date.now()}`,
      authorId: 'admin_security_01',
      authorName: 'UniAbuja Admin & Safety 🛡️',
      authorAvatar: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=150',
      authorDepartment: 'Dean of Student Affairs',
      authorLevel: '500L',
      isAnonymous: false,
      tag: '📢 Campus Notice',
      content: `[OFFICIAL ANNOUNCEMENT] ${headline}\n\n${message}`,
      createdAt: Date.now(),
      timeAgo: 'Just now',
      spicyCount: 0,
      capCount: 0,
      factsCount: 45,
      teaCount: 8,
      viewsCount: 500,
      comments: [],
    };
    setGossipPosts((prev) => [adminAnnouncement, ...prev]);

    confetti({
      particleCount: 80,
      spread: 75,
      origin: { y: 0.5 },
      colors: ['#a855f7', '#38bdf8', '#fbbf24', '#ffffff'],
    });

    setTimeout(() => {
      setSparkToast(null);
    }, 6000);
  };

  // Admin: Reset / Restore Demo Data
  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEYS.PROFILES);
    localStorage.removeItem(STORAGE_KEYS.SWIPED_IDS);
    localStorage.removeItem(STORAGE_KEYS.MATCHES);
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.REPORTS);
    localStorage.removeItem(STORAGE_KEYS.VERIFICATIONS);
    localStorage.removeItem('uoa_gossip_board_v3');
    localStorage.removeItem('uoa_campus_polls_v2');

    const defaultMatch: MatchItem = {
      id: 'match_init_01',
      matchedUser: INITIAL_PROFILES[0],
      createdAt: Date.now() - 3600000 * 12,
      expiresAt: Date.now() + 3600000 * 24 * 6.5,
      lastMessage: 'Hey Tariro! How was your exam today? 😊',
      lastMessageTime: Date.now() - 3600000 * 2,
      hasUnread: true,
      isLowkeyMatch: false,
    };

    setProfiles(INITIAL_PROFILES);
    setSwipedProfileIds([]);
    setMatches([defaultMatch]);
    setMessages({
      match_init_01: [
        {
          id: 'm1',
          matchId: 'match_init_01',
          senderId: 'user_01',
          text: 'Hey Tariro! How was your exam today? 😊',
          createdAt: Date.now() - 3600000 * 2,
          read: false,
        },
      ],
    });
    setReports(INITIAL_REPORTS);
    setVerificationRequests(INITIAL_VERIFICATIONS);
    setGossipPosts(INITIAL_GOSSIP_POSTS);
    setCampusPolls(INITIAL_CAMPUS_POLLS);
    setActivePollIndex(0);

    setSparkToast({
      show: true,
      message: 'Demo dataset restored to initial state ✨',
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
    setIsBoostActive(true);
    setBoostTimeLeft(1800); // 30 minutes in seconds
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#a855f7', '#38bdf8', '#ffffff'],
    });
  };

  // Who Liked Me profiles (Profiles that swiped right on Tariro)
  const whoLikedMeProfiles = profiles.filter(
    (p) => !swipedProfileIds.includes(p.id) && (p.id === 'user_02' || p.id === 'user_04' || p.id === 'user_06' || p.id === 'user_08')
  );

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
        resendVerificationEmail,
        requestAuthentication,
        isAdminAuthenticated,
        unlockAdmin,
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
        resetDemoData,
        isAuthModalOpen,
        setIsAuthModalOpen,
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
