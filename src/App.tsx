import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { SwipeDeck } from './components/SwipeDeck';
import { WhoLikedMeView } from './components/WhoLikedMeView';
import { ChatView } from './components/ChatView';
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
    <div className="relative min-h-screen bg-[#07020d] text-neutral-100 flex flex-col items-center justify-between font-sans selection:bg-purple-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-purple-900/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-fuchsia-950/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <Header />

      {/* Main Content Area */}
      <main className="w-full flex-1 max-w-md mx-auto flex flex-col justify-start relative z-10 pb-24 sm:pb-28 px-1">
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
              <ChatView
                onOpenProfileDetails={handleOpenProfileDetails}
                onOpenReport={handleOpenReport}
              />
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
        onReport={handleOpenReport}
      />

      <ReportModal
        targetUser={reportingUser}
        isOpen={!!reportingUser}
        onClose={() => setReportingUser(null)}
      />

      <MatchModal />
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
