import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
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
  } = useApp();

  // Modal and sub-view states
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [reportingUser, setReportingUser] = useState<UserProfile | null>(null);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showTips, setShowTips] = useState(false);

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

  return (
    <div className="uoa-app-shell relative min-h-[100dvh] w-full min-w-0 overflow-x-hidden text-neutral-100 flex flex-col items-center justify-between font-sans selection:bg-purple-500 selection:text-white">
      {/* Quiet ambient depth */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-violet-700/[0.05] blur-3xl" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-72 bg-fuchsia-700/[0.04] blur-3xl" />

      {/* Top Header */}
      <Header />

      {/* Main Content Area */}
      <main className="relative z-10 mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col justify-start px-3 pb-24 sm:px-5 sm:pb-28 lg:px-8">
        {showGuidelines ? (
          <CommunityGuidelinesView onBack={() => setShowGuidelines(false)} />
        ) : showTips ? (
          <TipsView onBack={() => setShowTips(false)} />
        ) : (
          <>
            {activeTab === 'discover' && (
              <SwipeDeck
                onOpenProfileDetails={handleOpenProfileDetails}
                onOpenReport={handleOpenReport}
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
          </>
        )}
      </main>

      {/* Bottom Nav — hidden while the protected admin console is open */}
      {activeTab !== 'admin' && <BottomNav />}

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
