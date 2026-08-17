import React, { useState, useMemo } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  useAnimationControls,
} from 'motion/react';
import {
  Heart,
  X,
  Star,
  RotateCcw,
  Zap,
  ShieldCheck,
  MapPin,
  GraduationCap,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Lock,
  SlidersHorizontal,
  Flag,
  Share2,
  Music2,
  Send,
  MessageCircle,
  Flame,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserProfile } from '../types';
import { CampusStoriesBar } from './CampusStoriesBar';
import { CampusPulseBar } from './CampusPulseBar';
import { CampusDailyPollCard } from './CampusDailyPollCard';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import { CampusGossipBoard } from './CampusGossipBoard';

interface SwipeDeckProps {
  onOpenProfileDetails: (profile: UserProfile) => void;
  onOpenReport?: (profile: UserProfile) => void;
}

export const SwipeDeck: React.FC<SwipeDeckProps> = ({
  onOpenProfileDetails,
  onOpenReport,
}) => {
  const {
    profiles,
    swipedProfileIds,
    swipeRight,
    swipeLeft,
    superLike,
    rewindLastSwipe,
    canRewind,
    currentMode,
    filters,
    setFilters,
    resetFilters,
    currentUser,
    setIsFiltersModalOpen,
    isPremium,
    setIsPremiumModalOpen,
    triggerBoost,
    isBoostActive,
    selectedVibeFilter,
    sendDirectSpark,
    gossipPosts,
  } = useApp();

  const [discoverTab, setDiscoverTab] = useState<'matches' | 'gossip'>('matches');
  const [sparkText, setSparkText] = useState('');
  const [isSparkInputOpen, setIsSparkInputOpen] = useState(false);

  // Filter available profiles
  const deckProfiles = useMemo(() => {
    return profiles.filter((p) => {
      // Don't show already swiped
      if (swipedProfileIds.includes(p.id)) return false;

      // Mode constraint
      if (currentMode === 'lowkey' && p.mode !== 'lowkey') return false;
      if (currentMode === 'normal' && p.mode === 'lowkey') return false;

      // Vibe filter
      if (selectedVibeFilter === 'trending') {
        const isTrending = p.badges?.some((b) => b.includes('High Match') || b.includes('Top Vibe') || b.includes('DJ') || b.includes('Radio'));
        if (!isTrending) return false;
      } else if (selectedVibeFilter === 'new') {
        if (p.level !== '100L' && p.level !== '200L') return false;
      } else if (selectedVibeFilter === 'science') {
        if (p.faculty !== 'Faculty of Science' && p.faculty !== 'Faculty of Engineering') return false;
      } else if (selectedVibeFilter === 'law') {
        if (p.faculty !== 'Faculty of Law' && p.faculty !== 'Faculty of Arts') return false;
      } else if (selectedVibeFilter === 'med') {
        if (p.faculty !== 'College of Health Sciences' && p.faculty !== 'Faculty of Pharmacy') return false;
      } else if (selectedVibeFilter === 'verified') {
        if (!p.isVerified) return false;
      } else if (selectedVibeFilter === 'dating') {
        if (p.lookingFor !== 'dating' && p.lookingFor !== 'both') return false;
      }

      // Gender filter
      if (filters.gender !== 'all' && p.gender !== filters.gender) return false;

      // Faculty filter
      if (filters.faculty !== 'all' && p.faculty !== filters.faculty) return false;

      // Department filter
      if (filters.department !== 'all' && p.department !== filters.department) return false;

      // Level filter
      if (filters.level !== 'all' && p.level !== filters.level) return false;

      // Quick filter: only my faculty
      if (filters.onlyMyFaculty && p.faculty !== currentUser.faculty) return false;

      // Quick filter: only my department
      if (filters.onlyMyDepartment && p.department !== currentUser.department) return false;

      // Verified filter
      if (filters.onlyVerified && !p.isVerified) return false;

      // Search Query
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesFaculty = p.faculty.toLowerCase().includes(q);
        const matchesDept = p.department.toLowerCase().includes(q);
        const matchesCourse = p.course.toLowerCase().includes(q);
        const matchesBio = p.bio.toLowerCase().includes(q);
        const matchesInterests = p.interests?.some((i) => i.toLowerCase().includes(q));
        if (
          !matchesName &&
          !matchesFaculty &&
          !matchesDept &&
          !matchesCourse &&
          !matchesBio &&
          !matchesInterests
        ) {
          return false;
        }
      }

      return true;
    });
  }, [profiles, swipedProfileIds, currentMode, filters, selectedVibeFilter, currentUser]);

  // Current top, next, and 3rd cards in deck
  const currentProfile = deckProfiles[0];
  const nextProfile = deckProfiles[1];
  const thirdProfile = deckProfiles[2];

  // Motion controls & values
  const controls = useAnimationControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Dynamic transforms based on drag
  const rotate = useTransform(x, [-250, 0, 250], [-20, 0, 20]);
  const opacityLike = useTransform(x, [25, 120], [0, 1]);
  const scaleLike = useTransform(x, [25, 120], [0.8, 1.05]);
  const opacityNope = useTransform(x, [-25, -120], [0, 1]);
  const scaleNope = useTransform(x, [-25, -120], [0.8, 1.05]);
  const opacitySuper = useTransform(y, [-25, -120], [0, 1]);
  const scaleSuper = useTransform(y, [-25, -120], [0.8, 1.1]);

  // Dynamic background card depth response
  const bgCardScale = useTransform(x, [-200, 0, 200], [0.98, 0.94, 0.98]);
  const bgCardOpacity = useTransform(x, [-200, 0, 200], [0.9, 0.65, 0.9]);
  const bgCardY = useTransform(x, [-200, 0, 200], [4, 14, 4]);

  // Active photo index inside card
  const [photoIndex, setPhotoIndex] = useState(0);
  // Expand full details inline on the card
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const isDraggingRef = React.useRef(false);

  const handleNextPhoto = (e: React.MouseEvent, max: number) => {
    e.stopPropagation();
    if (isDraggingRef.current) return;
    setPhotoIndex((prev) => (prev + 1 < max ? prev + 1 : 0));
  };

  const handlePrevPhoto = (e: React.MouseEvent, max: number) => {
    e.stopPropagation();
    if (isDraggingRef.current) return;
    setPhotoIndex((prev) => (prev - 1 >= 0 ? prev - 1 : max - 1));
  };

  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  const handleDragEnd = async (_: any, info: any) => {
    // Reset dragging flag after gesture completes
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);

    if (!currentProfile || isAnimatingOut) return;

    const thresholdX = 90;
    const thresholdY = -100;
    const velocityX = info.velocity.x;
    const velocityY = info.velocity.y;
    const offsetX = info.offset.x;
    const offsetY = info.offset.y;

    // Super Like gesture (Swipe Up flick or drag)
    if ((offsetY < thresholdY || velocityY < -450) && Math.abs(offsetX) < 100) {
      setIsAnimatingOut(true);
      await controls.start({
        y: -600,
        opacity: 0,
        scale: 1.08,
        transition: { duration: 0.28, ease: 'easeOut' },
      });
      superLike(currentProfile);
      resetCardState();
    } else if (offsetX > thresholdX || velocityX > 450) {
      // Swipe Right (Like / Meet)
      setIsAnimatingOut(true);
      await controls.start({
        x: 600,
        rotate: 25,
        opacity: 0,
        transition: { duration: 0.28, ease: 'easeOut' },
      });
      swipeRight(currentProfile);
      resetCardState();
    } else if (offsetX < -thresholdX || velocityX < -450) {
      // Swipe Left (Nope / Pass)
      setIsAnimatingOut(true);
      await controls.start({
        x: -600,
        rotate: -25,
        opacity: 0,
        transition: { duration: 0.28, ease: 'easeOut' },
      });
      swipeLeft(currentProfile);
      resetCardState();
    } else {
      // Snap back to origin with refined spring physics
      controls.start({
        x: 0,
        y: 0,
        rotate: 0,
        transition: {
          type: 'spring',
          stiffness: 450,
          damping: 28,
          velocity: Math.abs(velocityX) > 10 ? velocityX : 0,
        },
      });
    }
  };

  const resetCardState = () => {
    x.set(0);
    y.set(0);
    setPhotoIndex(0);
    setIsExpanded(false);
    setIsAnimatingOut(false);
  };

  const handleManualSwipe = async (direction: 'left' | 'right' | 'super') => {
    if (!currentProfile || isAnimatingOut) return;
    setIsAnimatingOut(true);

    if (direction === 'right') {
      await controls.start({
        x: 500,
        rotate: 22,
        opacity: 0,
        transition: { duration: 0.32, ease: 'easeOut' },
      });
      swipeRight(currentProfile);
    } else if (direction === 'left') {
      await controls.start({
        x: -500,
        rotate: -22,
        opacity: 0,
        transition: { duration: 0.32, ease: 'easeOut' },
      });
      swipeLeft(currentProfile);
    } else if (direction === 'super') {
      await controls.start({
        y: -500,
        scale: 1.1,
        opacity: 0,
        transition: { duration: 0.32, ease: 'easeOut' },
      });
      superLike(currentProfile);
    }

    resetCardState();
  };

  const handleRewindClick = () => {
    if (!canRewind) return;
    if (!isPremium) {
      setIsPremiumModalOpen(true);
      return;
    }
    rewindLastSwipe();
    resetCardState();
  };

  const handleSendInstantSpark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sparkText.trim() || !currentProfile) return;
    sendDirectSpark(currentProfile, sparkText.trim());
    setSparkText('');
    setIsSparkInputOpen(false);
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto min-w-0 flex flex-col justify-start items-center px-0 sm:px-2 lg:px-4 py-2 select-none">
      {/* 1. Campus Stories Bar */}
      <CampusStoriesBar />

      {/* 2. Campus Pulse & Vibe Filter Bar */}
      <CampusPulseBar />

      {/* 3. Daily Campus Poll Card */}
      <CampusDailyPollCard />

      {/* Discover Sub-Tab Segmented Control */}
      <div className="w-full flex items-center p-1 rounded-2xl bg-[#140624] border border-purple-900/50 mb-3 shadow-inner">
        <button
          onClick={() => setDiscoverTab('matches')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            discoverTab === 'matches'
              ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md shadow-purple-900/50'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Student Match Feed</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 font-extrabold">
            {deckProfiles.length}
          </span>
        </button>

        <button
          onClick={() => setDiscoverTab('gossip')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            discoverTab === 'gossip'
              ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md shadow-purple-900/50'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <span>☕ Gossip & Tea</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-fuchsia-950 text-fuchsia-300 font-extrabold border border-fuchsia-800/40">
            {gossipPosts.length}
          </span>
        </button>
      </div>

      {discoverTab === 'gossip' ? (
        /* Gossip Board View */
        <CampusGossipBoard />
      ) : (
        <>
          {/* Active Filters Tag Pills Bar */}
          {(filters.gender !== 'all' ||
            filters.faculty !== 'all' ||
            filters.department !== 'all' ||
            filters.level !== 'all' ||
            filters.onlyMyFaculty ||
            filters.onlyMyDepartment ||
            filters.onlyVerified ||
            filters.searchQuery.trim() !== '') && (
            <div className="w-full mb-2.5 p-2 rounded-2xl bg-[#130722] border border-purple-800/40 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shadow-inner">
              <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar text-[11px]">
                <span className="text-[10px] font-extrabold uppercase text-purple-400 shrink-0 ml-1">
                  Active:
                </span>

                {filters.searchQuery.trim() !== '' && (
                  <button
                    onClick={() => setFilters({ ...filters, searchQuery: '' })}
                    className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-600/50 text-purple-200 shrink-0 hover:bg-purple-800"
                  >
                    <span>"{filters.searchQuery}"</span>
                    <X className="w-3 h-3" />
                  </button>
                )}

                {filters.onlyMyFaculty && (
                  <button
                    onClick={() => setFilters({ ...filters, onlyMyFaculty: false })}
                    className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-600/50 text-purple-200 shrink-0 hover:bg-purple-800"
                  >
                    <span>Faculty ({currentUser.faculty.split(' ')[2] || 'Mine'})</span>
                    <X className="w-3 h-3" />
                  </button>
                )}

                {filters.onlyMyDepartment && (
                  <button
                    onClick={() => setFilters({ ...filters, onlyMyDepartment: false })}
                    className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-600/50 text-purple-200 shrink-0 hover:bg-purple-800"
                  >
                    <span>Dept ({currentUser.department})</span>
                    <X className="w-3 h-3" />
                  </button>
                )}

                {filters.gender !== 'all' && (
                  <button
                    onClick={() => setFilters({ ...filters, gender: 'all' })}
                    className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-600/50 text-purple-200 shrink-0 hover:bg-purple-800"
                  >
                    <span>{filters.gender}</span>
                    <X className="w-3 h-3" />
                  </button>
                )}

                {filters.faculty !== 'all' && (
                  <button
                    onClick={() => setFilters({ ...filters, faculty: 'all', department: 'all' })}
                    className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-600/50 text-purple-200 shrink-0 hover:bg-purple-800"
                  >
                    <span className="max-w-[120px] truncate">{filters.faculty}</span>
                    <X className="w-3 h-3" />
                  </button>
                )}

                {filters.department !== 'all' && (
                  <button
                    onClick={() => setFilters({ ...filters, department: 'all' })}
                    className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-600/50 text-purple-200 shrink-0 hover:bg-purple-800"
                  >
                    <span className="max-w-[120px] truncate">{filters.department}</span>
                    <X className="w-3 h-3" />
                  </button>
                )}

                {filters.level !== 'all' && (
                  <button
                    onClick={() => setFilters({ ...filters, level: 'all' })}
                    className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-600/50 text-purple-200 shrink-0 hover:bg-purple-800"
                  >
                    <span>{filters.level}</span>
                    <X className="w-3 h-3" />
                  </button>
                )}

                {filters.onlyVerified && (
                  <button
                    onClick={() => setFilters({ ...filters, onlyVerified: false })}
                    className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-600/50 text-purple-200 shrink-0 hover:bg-purple-800"
                  >
                    <span>Verified 🛡️</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <button
                onClick={resetFilters}
                className="text-[10px] text-fuchsia-400 hover:text-fuchsia-200 font-bold shrink-0 px-2 py-0.5 rounded bg-purple-950 border border-purple-800/40"
              >
                Clear
              </button>
            </div>
          )}

          {/* Swipe Cards Deck Area */}
          <div className="relative w-full max-w-5xl min-h-[30rem] h-[clamp(30rem,68dvh,36rem)] rounded-3xl flex items-center justify-center mt-1">
        {deckProfiles.length === 0 ? (
          /* Empty Deck State */
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#10061c]/90 border border-purple-900/30 rounded-3xl backdrop-blur-xl"
          >
            <motion.div
              animate={{
                scale: [1, 1.08, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-full bg-purple-950/60 border border-purple-800/40 flex items-center justify-center mb-4 text-purple-400"
            >
              <Sparkles className="w-10 h-10" />
            </motion.div>
            <h3 className="text-xl font-bold font-display text-purple-100">
              No More Profiles in {currentMode === 'lowkey' ? 'Lowkey Mode' : 'UniAbuja Feed'}
            </h3>
            <p className="text-sm text-neutral-400 mt-2 max-w-xs leading-relaxed">
              You’ve seen all active {currentMode === 'lowkey' ? 'Lowkey' : 'Normal'} students
              matching your current filters across campus.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 mt-6 w-full max-w-xs">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsFiltersModalOpen(true)}
                className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-purple-900/40 border border-purple-700/50 text-purple-200 text-sm font-semibold hover:bg-purple-800/50 transition-all"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Adjust Filters</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleRewindClick}
                disabled={!canRewind}
                className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-sm font-bold shadow-lg shadow-purple-900/50 disabled:opacity-40"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Rewind Last</span>
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <div className="relative w-full h-full perspective-1000">
            {/* Third Card in Stack (for realistic depth) */}
            {thirdProfile && (
              <div
                className="absolute inset-0 rounded-3xl overflow-hidden border border-purple-950/30 bg-[#0c0416] scale-[0.89] translate-y-7 opacity-35 pointer-events-none shadow-md"
              >
                <img
                  src={thirdProfile.photos[0]}
                  alt=""
                  className="w-full h-full object-cover filter blur-[2px] brightness-[0.4]"
                />
              </div>
            )}

            {/* Background Card Preview (Next Card) */}
            {nextProfile && (
              <motion.div
                style={{
                  scale: bgCardScale,
                  opacity: bgCardOpacity,
                  y: bgCardY,
                }}
                className="absolute inset-0 rounded-3xl overflow-hidden border border-purple-950/50 bg-[#120720] pointer-events-none shadow-xl transition-shadow"
              >
                <img
                  src={nextProfile.photos[0]}
                  alt={nextProfile.name}
                  className="w-full h-full object-cover filter brightness-[0.7]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090410] via-transparent to-black/30" />
                <div className="absolute bottom-5 left-5 right-5 text-left">
                  <span className="text-lg font-bold text-neutral-300">
                    {nextProfile.name}, {nextProfile.age}
                  </span>
                  <p className="text-xs text-neutral-400 truncate">{nextProfile.department}</p>
                </div>
              </motion.div>
            )}

            {/* Top Interactive Card */}
            {currentProfile && (
              <motion.div
                key={currentProfile.id}
                animate={controls}
                style={{ x, y, rotate }}
                drag={isExpanded ? false : true}
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={{ left: 0.9, right: 0.9, top: 0.85, bottom: 0.18 }}
                dragTransition={{ bounceStiffness: 450, bounceDamping: 28 }}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                whileDrag={{ scale: 1.025, cursor: 'grabbing' }}
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                className="absolute inset-0 rounded-3xl overflow-hidden border border-purple-800/40 bg-[#0e0618] shadow-2xl select-none flex flex-col cursor-grab active:cursor-grabbing touch-none"
              >
                {/* When Card is not expanded: Full Photo with Overlays & Scroll down trigger */}
                {!isExpanded ? (
                  <div className="relative w-full h-full bg-neutral-950 flex flex-col justify-between">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={photoIndex}
                        src={currentProfile.photos[photoIndex] || currentProfile.photos[0]}
                        alt={currentProfile.name}
                        initial={{ opacity: 0.85 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0.85 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 w-full h-full object-cover"
                        draggable={false}
                      />
                    </AnimatePresence>

                    {/* Top Photo Navigation Indicators */}
                    {currentProfile.photos.length > 1 && (
                      <div className="absolute top-3 left-3 right-3 flex items-center space-x-1.5 z-20">
                        {currentProfile.photos.map((_, i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-200 ${
                              i === photoIndex
                                ? 'bg-white shadow-[0_0_8px_#ffffff]'
                                : 'bg-black/50 backdrop-blur-sm'
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Left / Right Photo Tap Zones */}
                    <div
                      onClick={(e) => handlePrevPhoto(e, currentProfile.photos.length)}
                      className="absolute top-0 bottom-36 left-0 w-1/3 z-10 cursor-pointer"
                      title="Previous Photo"
                    />
                    <div
                      onClick={(e) => handleNextPhoto(e, currentProfile.photos.length)}
                      className="absolute top-0 bottom-36 right-0 w-1/3 z-10 cursor-pointer"
                      title="Next Photo"
                    />

                    {/* Like / Nope / Super Like Floating Stamp Overlays */}
                    <motion.div
                      style={{ opacity: opacityLike, scale: scaleLike }}
                      className="absolute top-10 left-6 z-30 pointer-events-none transform -rotate-12 border-4 border-emerald-400 bg-emerald-950/85 px-4 py-1.5 rounded-2xl text-emerald-300 font-extrabold text-2xl tracking-wider shadow-[0_0_25px_rgba(52,211,153,0.8)] flex items-center space-x-1.5"
                    >
                      <Heart className="w-6 h-6 fill-emerald-300" />
                      <span>MEET</span>
                    </motion.div>

                    <motion.div
                      style={{ opacity: opacityNope, scale: scaleNope }}
                      className="absolute top-10 right-6 z-30 pointer-events-none transform rotate-12 border-4 border-rose-500 bg-rose-950/85 px-4 py-1.5 rounded-2xl text-rose-300 font-extrabold text-2xl tracking-wider shadow-[0_0_25px_rgba(244,63,94,0.8)] flex items-center space-x-1.5"
                    >
                      <X className="w-6 h-6 stroke-[3]" />
                      <span>PASS</span>
                    </motion.div>

                    <motion.div
                      style={{ opacity: opacitySuper, scale: scaleSuper }}
                      className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none border-4 border-amber-400 bg-amber-950/90 px-5 py-2 rounded-2xl text-amber-300 font-black text-xl tracking-wider shadow-[0_0_30px_rgba(251,191,36,0.9)] flex items-center space-x-2"
                    >
                      <Star className="w-6 h-6 fill-amber-300" />
                      <span>SUPER VIBE</span>
                    </motion.div>

                    {/* Bottom Vignette & Information with Scroll / Expand Trigger */}
                    <div className="mt-auto relative z-20 bg-gradient-to-t from-[#090410] via-[#090410]/95 to-transparent pt-16 pb-3.5 px-4 sm:px-5 flex flex-col justify-end">
                      {/* Active, Verified & Campus Status Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        {currentProfile.isVerified && (
                          <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-purple-900/80 border border-purple-400/50 text-purple-200 text-[10px] font-bold shadow-sm backdrop-blur-md">
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
                            <span>UniAbuja Verified</span>
                          </span>
                        )}

                        {currentProfile.currentStatus && (
                          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-400/50 text-indigo-200 text-[10px] font-bold backdrop-blur-md">
                            <span>📍 {currentProfile.currentStatus}</span>
                          </span>
                        )}

                        {currentProfile.campusVibe && (
                          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-pink-950/80 border border-pink-400/50 text-pink-200 text-[10px] font-bold backdrop-blur-md">
                            <span>{currentProfile.campusVibe}</span>
                          </span>
                        )}

                        <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-black/60 text-neutral-300 text-[10px] backdrop-blur-md border border-neutral-800">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              currentProfile.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'
                            }`}
                          />
                          <span>{currentProfile.lastActive}</span>
                        </span>
                      </div>

                      {/* Name, Age, & Actions */}
                      <div className="flex items-end justify-between gap-2">
                        <div className="flex-1">
                          <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight flex items-center">
                            {currentProfile.name}
                            <span className="text-xl sm:text-2xl font-light text-purple-300 ml-2">
                              {currentProfile.age}
                            </span>
                          </h2>

                          {/* Level, Faculty & Department */}
                          <div className="flex items-center space-x-1.5 text-xs text-purple-200/90 font-medium mt-0.5">
                            <GraduationCap className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span className="font-bold text-white bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-800/40">
                              {currentProfile.level}
                            </span>
                            <span className="truncate">{currentProfile.department}</span>
                          </div>

                          {/* Location & Distance */}
                          <div className="flex items-center space-x-1 text-[11px] text-neutral-400 mt-1">
                            <MapPin className="w-3 h-3 text-purple-400 shrink-0" />
                            <span>{currentProfile.campusLocation}</span>
                            {currentProfile.distanceKm && (
                              <span>• {currentProfile.distanceKm} km away</span>
                            )}
                          </div>
                        </div>

                        {/* Direct Spark & Info Expand Buttons */}
                        <div className="flex items-center space-x-2 shrink-0">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsSparkInputOpen(!isSparkInputOpen);
                            }}
                            className="p-2.5 rounded-full bg-gradient-to-tr from-purple-600 to-fuchsia-600 border border-purple-400/60 text-white shadow-lg shrink-0 hover:brightness-110 transition-all"
                            title="Send Instant Spark Icebreaker"
                          >
                            <Zap className="w-4 h-4 fill-white" />
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsExpanded(true);
                            }}
                            className="p-2.5 rounded-full bg-purple-900/80 border border-purple-500/60 text-purple-100 hover:bg-purple-800 transition-all shadow-lg shrink-0"
                            id="expand-profile-inline-btn"
                            title="Scroll Down & Read Full Bio"
                          >
                            <Info className="w-5 h-5" />
                          </motion.button>
                        </div>
                      </div>

                      {/* Voice Note Player if user has voice note */}
                      {currentProfile.voiceNoteText && (
                        <div className="mt-2.5">
                          <VoiceNotePlayer
                            text={currentProfile.voiceNoteText}
                            duration={currentProfile.voiceNoteDuration || '0:18'}
                            userName={currentProfile.name.split(' ')[0]}
                          />
                        </div>
                      )}

                      {/* Instant Spark Popup Form */}
                      {isSparkInputOpen && (
                        <motion.form
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onSubmit={handleSendInstantSpark}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-2.5 p-2.5 rounded-2xl bg-black/85 backdrop-blur-xl border border-purple-500/60 flex items-center space-x-2 shadow-2xl"
                        >
                          <input
                            type="text"
                            value={sparkText}
                            onChange={(e) => setSparkText(e.target.value)}
                            placeholder={`Spark icebreaker to ${currentProfile.name.split(' ')[0]}...`}
                            className="flex-1 bg-transparent text-xs text-white placeholder-neutral-400 focus:outline-none px-2"
                            autoFocus
                          />
                          <button
                            type="submit"
                            disabled={!sparkText.trim()}
                            className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white disabled:opacity-40 shadow-md"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </motion.form>
                      )}

                      {/* Prompts / Scroll Hint Banner */}
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsExpanded(true)}
                        className="mt-2 w-full py-1.5 px-3 rounded-xl bg-purple-950/70 border border-purple-800/50 hover:bg-purple-900/80 transition-all text-purple-200 text-xs font-semibold flex items-center justify-between backdrop-blur-md"
                        id="scroll-down-card-prompt-btn"
                      >
                        <span className="flex items-center space-x-1.5 truncate">
                          <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="truncate">
                            {currentProfile.icebreakerPrompts?.[0]?.question ||
                              'Read full bio & questions'}
                          </span>
                        </span>
                        <span className="flex items-center text-[10px] text-purple-300 font-bold shrink-0 ml-2">
                          <span>Full Bio</span>
                          <ChevronDown className="w-3.5 h-3.5 ml-0.5 animate-bounce" />
                        </span>
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  /* Expanded Scrollable Profile View directly on card */
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative w-full h-full bg-[#0c0517] flex flex-col overflow-y-auto custom-scrollbar"
                  >
                    {/* Sticky Collapse Bar */}
                    <div className="sticky top-0 z-30 bg-[#120722]/95 backdrop-blur-xl border-b border-purple-900/40 p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white">
                          {currentProfile.name}, {currentProfile.age}
                        </span>
                        {currentProfile.isVerified && (
                          <ShieldCheck className="w-4 h-4 text-purple-400" />
                        )}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsExpanded(false)}
                        className="flex items-center space-x-1 px-3 py-1 rounded-full bg-purple-900/80 border border-purple-700/50 text-purple-200 text-xs font-bold hover:bg-purple-800"
                        id="collapse-profile-btn"
                      >
                        <span>Back to Photo</span>
                        <ChevronUp className="w-4 h-4" />
                      </motion.button>
                    </div>

                    {/* Scrollable details body */}
                    <div className="p-4 space-y-4 pb-20">
                      {/* Photo Thumbnail Strip */}
                      <div>
                        <div className="relative h-56 rounded-2xl overflow-hidden border border-purple-900/40 bg-black">
                          <img
                            src={currentProfile.photos[photoIndex] || currentProfile.photos[0]}
                            alt={currentProfile.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {currentProfile.photos.length > 1 && (
                          <div className="flex space-x-2 mt-2 overflow-x-auto custom-scrollbar pb-1">
                            {currentProfile.photos.map((photo, i) => (
                              <button
                                key={i}
                                onClick={() => setPhotoIndex(i)}
                                className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                                  photoIndex === i
                                    ? 'border-purple-400 scale-105'
                                    : 'border-purple-950 opacity-60'
                                }`}
                              >
                                <img src={photo} alt="" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Voice Note Player in Expanded view */}
                      {currentProfile.voiceNoteText && (
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                            Campus Voice Bio 🎙️
                          </h4>
                          <VoiceNotePlayer
                            text={currentProfile.voiceNoteText}
                            duration={currentProfile.voiceNoteDuration || '0:18'}
                            userName={currentProfile.name.split(' ')[0]}
                          />
                        </div>
                      )}

                      {/* Bio Card */}
                      <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-900/40">
                        <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-1">
                          About Me
                        </h4>
                        <p className="text-xs text-neutral-200 leading-relaxed whitespace-pre-line">
                          {currentProfile.bio}
                        </p>
                      </div>

                      {/* Academic & Campus Info */}
                      <div className="p-3.5 rounded-2xl bg-[#140824] border border-purple-900/30 space-y-2">
                        <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                          UniAbuja Academic Info
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-neutral-300">
                          <GraduationCap className="w-4 h-4 text-purple-400 shrink-0" />
                          <span>
                            <strong className="text-white">{currentProfile.level}</strong> •{' '}
                            {currentProfile.faculty} ({currentProfile.department})
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-neutral-300">
                          <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
                          <span>{currentProfile.campusLocation}</span>
                        </div>
                        {currentProfile.spotifyTopArtist && (
                          <div className="flex items-center space-x-2 text-xs text-emerald-300 pt-1">
                            <Music2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>Spotify Top: <strong>{currentProfile.spotifyTopArtist}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Icebreaker Prompts with Interactive Reply */}
                      {currentProfile.icebreakerPrompts &&
                        currentProfile.icebreakerPrompts.length > 0 && (
                          <div className="space-y-2.5">
                            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                              Campus Prompts & Icebreakers
                            </h4>
                            {currentProfile.icebreakerPrompts.map((prompt) => (
                              <div
                                key={prompt.id}
                                className="p-3.5 rounded-2xl bg-gradient-to-br from-[#1b0a33] to-[#110522] border border-purple-800/40 space-y-2"
                              >
                                <span className="text-[11px] font-bold text-purple-300 block">
                                  {prompt.question}
                                </span>
                                <p className="text-xs text-white font-medium italic">
                                  "{prompt.answer}"
                                </p>
                                <button
                                  onClick={() => {
                                    sendDirectSpark(
                                      currentProfile,
                                      `Replying to "${prompt.question}": That's awesome!`
                                    );
                                  }}
                                  className="text-[11px] font-semibold text-purple-300 hover:text-purple-100 flex items-center space-x-1 pt-1"
                                >
                                  <Zap className="w-3 h-3 text-amber-400" />
                                  <span>Send Spark to this Answer ⚡</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                      {/* Interests */}
                      {currentProfile.interests && currentProfile.interests.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">
                            Interests & Vibe
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {currentProfile.interests.map((interest, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 rounded-full bg-purple-950 border border-purple-800/50 text-[11px] text-purple-200"
                              >
                                #{interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Safety & Report Trigger */}
                      <div className="pt-2 flex items-center justify-between border-t border-purple-950/80">
                        <button
                          onClick={() => {
                            if (onOpenReport) onOpenReport(currentProfile);
                          }}
                          className="flex items-center space-x-1 text-xs text-neutral-400 hover:text-rose-400 transition-colors"
                          id="report-user-from-card-btn"
                        >
                          <Flag className="w-3.5 h-3.5" />
                          <span>Report Profile to Campus Safety</span>
                        </button>

                        <button
                          onClick={() => onOpenProfileDetails(currentProfile)}
                          className="text-xs text-purple-400 font-bold hover:underline"
                        >
                          Full Page View →
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Swipe Action Controls Bar */}
      <div
        className="w-full flex items-center justify-center gap-3 sm:gap-4 pt-3 pb-1"
        id="swipe-action-controls"
      >
        {/* Rewind */}
        <motion.button
          whileHover={{ scale: canRewind ? 1.15 : 1 }}
          whileTap={{ scale: canRewind ? 0.9 : 1 }}
          onClick={handleRewindClick}
          disabled={!canRewind || isAnimatingOut}
          className={`p-3 rounded-full border transition-colors duration-200 ${
            canRewind
              ? 'bg-[#150a24] border-purple-900/60 text-amber-400 hover:border-amber-500 shadow-md'
              : 'bg-[#10061c]/40 border-neutral-900 text-neutral-600 opacity-40 cursor-not-allowed'
          }`}
          title="Rewind Last Swipe (VIP Feature)"
          id="btn-swipe-rewind"
        >
          <RotateCcw className="w-5 h-5" />
        </motion.button>

        {/* Pass (Nope) */}
        <motion.button
          whileHover={{ scale: currentProfile ? 1.15 : 1 }}
          whileTap={{ scale: currentProfile ? 0.88 : 1 }}
          onClick={() => handleManualSwipe('left')}
          disabled={!currentProfile || isAnimatingOut}
          className="p-4 sm:p-4.5 rounded-full bg-[#180924] border-2 border-rose-600/40 text-rose-400 hover:text-white hover:bg-rose-600 hover:border-rose-500 transition-colors shadow-[0_0_15px_rgba(244,63,94,0.2)] disabled:opacity-40"
          title="Pass Profile"
          id="btn-swipe-nope"
        >
          <X className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
        </motion.button>

        {/* Super Like */}
        <motion.button
          whileHover={{ scale: currentProfile ? 1.15 : 1 }}
          whileTap={{ scale: currentProfile ? 0.88 : 1 }}
          onClick={() => handleManualSwipe('super')}
          disabled={!currentProfile || isAnimatingOut}
          className="p-3 sm:p-3.5 rounded-full bg-[#180924] border-2 border-cyan-500/40 text-cyan-400 hover:text-white hover:bg-cyan-600 hover:border-cyan-400 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.25)] disabled:opacity-40"
          title="Super Like"
          id="btn-swipe-superlike"
        >
          <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
        </motion.button>

        {/* Like (Meet) */}
        <motion.button
          whileHover={{ scale: currentProfile ? 1.15 : 1 }}
          whileTap={{ scale: currentProfile ? 0.88 : 1 }}
          onClick={() => handleManualSwipe('right')}
          disabled={!currentProfile || isAnimatingOut}
          className="p-4 sm:p-4.5 rounded-full bg-gradient-to-tr from-purple-700 to-fuchsia-600 text-white border-2 border-purple-400/50 transition-colors shadow-[0_0_25px_rgba(168,85,247,0.5)] disabled:opacity-40"
          title="Like Profile"
          id="btn-swipe-like"
        >
          <Heart className="w-6 h-6 sm:w-7 sm:h-7 fill-white stroke-white stroke-[2]" />
        </motion.button>

        {/* Profile Boost */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={triggerBoost}
          className={`p-3 rounded-full border transition-colors duration-200 ${
            isBoostActive
              ? 'bg-purple-900 border-purple-400 text-purple-200 animate-pulse shadow-[0_0_15px_#a855f7]'
              : 'bg-[#150a24] border-purple-900/60 text-purple-400 hover:border-purple-500'
          }`}
          title="Boost Profile for 30 Mins"
          id="btn-swipe-boost"
        >
          <Zap className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Quick Tea Banner Under Deck */}
      {gossipPosts.length > 0 && (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setDiscoverTab('gossip')}
          className="w-full mt-4 p-3 rounded-2xl bg-gradient-to-r from-purple-950/60 via-[#190729] to-fuchsia-950/50 border border-purple-800/40 text-left flex items-center justify-between group shadow-lg"
        >
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <span className="text-base">☕</span>
            <div className="truncate">
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300">
                  Trending Campus Tea
                </span>
                <span className="text-[10px] text-fuchsia-400 font-bold">• {gossipPosts[0].tag}</span>
              </div>
              <p className="text-xs text-neutral-300 truncate max-w-[260px]">
                "{gossipPosts[0].content}"
              </p>
            </div>
          </div>

          <span className="text-[11px] text-purple-300 font-bold group-hover:text-purple-100 shrink-0 ml-2">
            Read All ({gossipPosts.length}) →
          </span>
        </motion.button>
      )}
    </>
  )}
</div>
);
};

