import React, { useCallback, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DesktopSidebar } from './components/DesktopSidebar';
import { DesktopCampusRail } from './components/DesktopCampusRail';
import { SwipeDeck } from './components/SwipeDeck';
import { WhoLikedMeView } from './components/WhoLikedMeView';
import { ChatView } from './components/ChatView';
import { ChatAccessGate } from './components/ChatAccessGate';
import { SafetyCenterView } from './components/SafetyCenterView';
import { MyProfileView } from './components/MyProfileView';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminAccessGate } from './components/AdminAccessGate';
import { CommunityGuidelinesView } from './components/CommunityGuidelinesView';
import { TipsView } from './components/TipsView';

// Modals
import { ProfileDetailModal } from './components/ProfileDetailModal';
import { MatchModal } from './components/MatchModal';
import { FiltersModal } from './components/FiltersModal';
import { PremiumModal } from './components/PremiumModal';
import { VerificationModal } from './components/VerificationModal';
import { AuthModal } from './components/AuthModal';
import { ProfileEditModal } from './components/ProfileEditModal';
import { ReportModal } from './components/ReportModal';
import { UserProfile } from './types';

const MainAppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setIsProfileEditModalOpen,
    recentMatch,
    setRecentMatch,
    isAdminAuthenticated,
    logoutAdmin,
    isAuthenticated,
    isAuthLoading,
  } = useApp();

  const isStandaloneSignedOutProfile = activeTab === 'profile' && !isAuthenticated && !isAuthLoading;

  // Modal and sub-view states
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [reportingUser, setReportingUser] = useState<UserProfile | null>(null);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [shouldOpenCampusConversation, setShouldOpenCampusConversation] = useState(false);
  const handleCampusConversationOpened = useCallback(() => setShouldOpenCampusConversation(false), []);

  const handleOpenProfileDetails = (profile: UserProfile) => {
    setSelectedProfile(profile);
  };

  const handleOpenReport = (profile: UserProfile) => {
    setReportingUser(profile);
  };

  const handleExitAdmin = () => {
    logoutAdmin();
    setActiveTab('discover');
    if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
      window.history.replaceState({}, '', '/');
    }
  };

  const showDesktopWorkspace = !isStandaloneSignedOutProfile && activeTab !== 'admin';
  const showDesktopCampusRail = showDesktopWorkspace && activeTab === 'discover' && !showGuidelines && !showTips;

  return (
    <div className="uoa-app-shell relative min-h-[100dvh] w-full min-w-0 overflow-x-hidden text-neutral-100 flex flex-col items-center justify-between font-sans selection:bg-pink-500 selection:text-white">
      {/* Quiet ambient depth */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-pink-700/[0.05] blur-3xl" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-72 bg-orange-700/[0.04] blur-3xl" />

      {/* Top Header */}
      {!isStandaloneSignedOutProfile && <Header />}

      {/* Main Content Area */}
      <main
        className={
          isStandaloneSignedOutProfile
            ? 'relative z-10 flex w-full flex-1 flex-col'
            : 'relative z-10 mx-auto flex w-full min-w-0 max-w-[1440px] flex-1 flex-col justify-start px-3 pb-24 sm:px-5 sm:pb-28 lg:px-6 lg:pb-10'
        }
      >
        {showGuidelines ? (
          <CommunityGuidelinesView onBack={() => setShowGuidelines(false)} />
        ) : showTips ? (
          <TipsView onBack={() => setShowTips(false)} />
        ) : (
          <div
            className={
              showDesktopWorkspace
                ? 'mx-auto grid w-full min-w-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_280px] xl:gap-6'
                : 'w-full min-w-0'
            }
          >
            {showDesktopWorkspace && <DesktopSidebar />}

            <section className="min-w-0">
              {activeTab === 'discover' && (
                <SwipeDeck
                  onOpenProfileDetails={handleOpenProfileDetails}
                  onOpenReport={handleOpenReport}
                  openCampusConversation={shouldOpenCampusConversation}
                  onCampusConversationOpened={handleCampusConversationOpened}
                />
              )}

              {activeTab === 'likes' && (
                <WhoLikedMeView onOpenProfileDetails={handleOpenProfileDetails} />
              )}

              {activeTab === 'matches' && (
                <ChatAccessGate>
                  <ChatView
                    onOpenProfileDetails={handleOpenProfileDetails}
                    onOpenReport={handleOpenReport}
                  />
                </ChatAccessGate>
              )}

              {activeTab === 'safety' && (
                <SafetyCenterView
                  onOpenGuidelines={() => setShowGuidelines(true)}
                  onOpenTips={() => setShowTips(true)}
                />
              )}

              {activeTab === 'profile' && (
                <MyProfileView
                  onOpenEditProfile={() => setIsProfileEditModalOpen(true)}
                  onOpenGuidelines={() => setShowGuidelines(true)}
                  onOpenTips={() => setShowTips(true)}
                />
              )}

              {activeTab === 'admin' &&
                (isAdminAuthenticated ? (
                  <AdminDashboard onExit={handleExitAdmin} />
                ) : (
                  <AdminAccessGate onBack={handleExitAdmin} />
                ))}
            </section>

            {showDesktopCampusRail && (
              <DesktopCampusRail
                onOpenConversation={() => {
                  setActiveTab('discover');
                  setShouldOpenCampusConversation(true);
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* Bottom Nav — hidden while the protected admin console is open */}
      {activeTab !== 'admin' && !isStandaloneSignedOutProfile && <BottomNav />}

      {/* Modals & Overlays */}
      <ProfileDetailModal
        profile={selectedProfile}
        isOpen={!!selectedProfile}
        onClose={() => setSelectedProfile(null)}
        onOpenReport={handleOpenReport}
      />

      <ReportModal
        targetUser={reportingUser}
        isOpen={!!reportingUser}
        onClose={() => setReportingUser(null)}
      />

      <MatchModal
        matchedProfile={recentMatch}
        onClose={() => setRecentMatch(null)}
      />
      <FiltersModal />
      <PremiumModal />
      <VerificationModal />
      <AuthModal />
      <ProfileEditModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
