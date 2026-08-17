import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Eye,
  UserX,
  UserCheck,
  Lock,
  Flame,
  Award,
  RefreshCw,
  Megaphone,
  Radio,
  Trash2,
  Sparkles,
  ArrowLeft,
  MessageSquare,
  BarChart2,
  X,
  ExternalLink,
  ChevronRight,
  Send,
  Camera,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserProfile, UserReport, VerificationRequest, GossipPost } from '../types';

interface AdminDashboardProps {
  onExit: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit }) => {
  const {
    profiles,
    currentUser,
    reports,
    verificationRequests,
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
    gossipPosts,
    campusPolls,
    matches,
  } = useApp();

  // Tab State
  const [activeAdminTab, setActiveAdminTab] = useState<
    'verifications' | 'reports' | 'users' | 'gossip' | 'broadcasts'
  >('verifications');

  // Sub-filters
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'resolved' | 'banned'>('pending');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'verified' | 'unverified' | 'banned' | 'lowkey'>('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Modals inside Admin
  const [inspectPhotoUrl, setInspectPhotoUrl] = useState<{ url: string; title: string } | null>(null);
  const [selectedRejectReq, setSelectedRejectReq] = useState<VerificationRequest | null>(null);
  const [rejectReasonPreset, setRejectReasonPreset] = useState('Face angle mismatch with profile');
  const [customRejectNote, setCustomRejectNote] = useState('');
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastHeadline, setBroadcastHeadline] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Metrics
  const totalStudents = profiles.length + 1; // + current user
  const verifiedCount = profiles.filter((p) => p.isVerified).length + (currentUser.isVerified ? 1 : 0);
  const pendingVerifications = verificationRequests.filter((v) => v.status === 'pending').length;
  const pendingReports = reports.filter((r) => r.status === 'pending').length;
  const bannedCount = profiles.filter((p) => p.isBanned).length;

  // Filtered Verification Requests
  const filteredVerifications = verificationRequests.filter((req) => {
    if (verificationFilter === 'all') return true;
    return req.status === verificationFilter;
  });

  // Filtered Reports
  const filteredReports = reports.filter((rep) => {
    if (reportFilter === 'all') return true;
    return rep.status === reportFilter;
  });

  // Filtered Student Directory
  const filteredUsers = profiles.filter((p) => {
    // Search query
    const matchesSearch =
      p.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      p.department.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      p.faculty.toLowerCase().includes(userSearchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter
    if (userStatusFilter === 'verified') return p.isVerified;
    if (userStatusFilter === 'unverified') return !p.isVerified;
    if (userStatusFilter === 'banned') return p.isBanned;
    if (userStatusFilter === 'lowkey') return p.mode === 'lowkey';

    return true;
  });

  // Handle Submit Rejection
  const handleConfirmReject = () => {
    if (!selectedRejectReq) return;
    const finalNote = customRejectNote.trim() || rejectReasonPreset;
    rejectVerification(selectedRejectReq.id, finalNote);
    showToast(`Verification rejected for ${selectedRejectReq.userName}. Note logged.`);
    setSelectedRejectReq(null);
    setCustomRejectNote('');
  };

  // Handle Send Broadcast
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastHeadline.trim() || !broadcastMessage.trim()) return;
    broadcastCampusAlert(broadcastHeadline.trim(), broadcastMessage.trim());
    showToast('Campus-wide announcement broadcasted successfully! 📢');
    setBroadcastHeadline('');
    setBroadcastMessage('');
    setIsBroadcastModalOpen(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col p-3 sm:p-4 space-y-4 overflow-y-auto custom-scrollbar pb-28 text-white">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-purple-950 border border-purple-500 text-purple-200 text-xs font-bold shadow-2xl flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-purple-900/60">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onExit}
            className="p-2 rounded-xl bg-[#17082c] border border-purple-800/60 text-purple-300 hover:text-white hover:bg-purple-900 transition-all flex items-center space-x-1"
            title="Return to Student Discovery Feed"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-bold hidden sm:inline">Exit Portal</span>
          </button>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-black font-display text-white">
                UniAbuja Admin Console
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-[10px] font-extrabold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live</span>
              </span>
            </div>
            <p className="text-[11px] text-purple-300">
              Identity verification, disciplinary reports & campus moderation
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setIsBroadcastModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:brightness-110 text-white text-xs font-bold shadow-md flex items-center space-x-1"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Broadcast</span>
          </button>

          <button
            onClick={clearLocalCache}
            title="Clear Local Cache"
            className="p-2 rounded-xl bg-purple-950/80 border border-purple-800/40 text-purple-300 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-3 rounded-2xl bg-[#130722] border border-purple-950 shadow-inner">
          <span className="text-[10px] uppercase font-bold text-purple-400 block">Total Students</span>
          <p className="text-xl font-black text-white mt-0.5">{totalStudents}</p>
          <span className="text-[9px] text-neutral-400">Main & Mini Campus</span>
        </div>

        <div className="p-3 rounded-2xl bg-[#130722] border border-purple-950 shadow-inner">
          <span className="text-[10px] uppercase font-bold text-emerald-400 block">Verified Rate</span>
          <p className="text-xl font-black text-emerald-300 mt-0.5">
            {Math.round((verifiedCount / totalStudents) * 100)}%
          </p>
          <span className="text-[9px] text-neutral-400">{verifiedCount} with student badge</span>
        </div>

        <div className="p-3 rounded-2xl bg-[#130722] border border-purple-950 shadow-inner">
          <span className="text-[10px] uppercase font-bold text-amber-400 block">Pending ID Checks</span>
          <p className="text-xl font-black text-amber-300 mt-0.5">{pendingVerifications}</p>
          <span className="text-[9px] text-neutral-400">Awaiting facial check</span>
        </div>

        <div className="p-3 rounded-2xl bg-[#130722] border border-purple-950 shadow-inner">
          <span className="text-[10px] uppercase font-bold text-rose-400 block">Open Reports</span>
          <p className="text-xl font-black text-rose-400 mt-0.5">{pendingReports}</p>
          <span className="text-[9px] text-neutral-400">{bannedCount} suspended</span>
        </div>
      </div>

      {/* Admin Tab Switcher */}
      <div className="flex items-center p-1 rounded-2xl bg-[#120620] border border-purple-950 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveAdminTab('verifications')}
          className={`flex-1 min-w-[120px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            activeAdminTab === 'verifications'
              ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verifications ({pendingVerifications})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('reports')}
          className={`flex-1 min-w-[110px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            activeAdminTab === 'reports'
              ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Reports ({pendingReports})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('users')}
          className={`flex-1 min-w-[120px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            activeAdminTab === 'users'
              ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Directory ({profiles.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('gossip')}
          className={`flex-1 min-w-[110px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            activeAdminTab === 'gossip'
              ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Gossip ({gossipPosts.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('broadcasts')}
          className={`flex-1 min-w-[110px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            activeAdminTab === 'broadcasts'
              ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Polls & Broadcast</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SELFIE & ID VERIFICATIONS QUEUE                                    */}
      {/* ========================================================================= */}
      {activeAdminTab === 'verifications' && (
        <div className="space-y-3">
          {/* Sub-status Filter Buttons */}
          <div className="flex items-center space-x-1.5 pb-1 overflow-x-auto no-scrollbar text-xs">
            {(['pending', 'approved', 'rejected', 'all'] as const).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setVerificationFilter(filterType)}
                className={`px-3 py-1 rounded-xl font-bold capitalize transition-all ${
                  verificationFilter === filterType
                    ? 'bg-purple-900/90 text-white border border-purple-500/50 shadow-sm'
                    : 'bg-[#140825] text-neutral-400 hover:text-neutral-200 border border-purple-950'
                }`}
              >
                {filterType === 'pending'
                  ? `Pending (${verificationRequests.filter((v) => v.status === 'pending').length})`
                  : filterType}
              </button>
            ))}
          </div>

          {filteredVerifications.length === 0 ? (
            <div className="p-8 text-center bg-[#120620] rounded-3xl border border-purple-950 text-neutral-400 text-xs space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto opacity-60" />
              <p>No verification requests matching "{verificationFilter}".</p>
              {verificationFilter !== 'all' && (
                <button
                  onClick={() => setVerificationFilter('all')}
                  className="text-purple-400 font-bold hover:underline text-xs"
                >
                  View all requests
                </button>
              )}
            </div>
          ) : (
            filteredVerifications.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-3xl bg-[#140825] border border-purple-900/40 space-y-3 shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm text-white">{req.userName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 text-[10px] font-mono font-bold border border-purple-800">
                        @{req.username}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {req.faculty} • {req.department}
                    </p>
                    <span className="text-[10px] text-neutral-500">
                      Submitted: {new Date(req.submittedAt).toLocaleTimeString()} •{' '}
                      {new Date(req.submittedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      req.status === 'approved'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/40'
                        : req.status === 'rejected'
                        ? 'bg-rose-950 text-rose-300 border border-rose-600/40'
                        : 'bg-amber-950 text-amber-300 border border-amber-600/40 animate-pulse'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                {/* Photo Comparison Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-purple-300 block">
                      1. Profile Photo
                    </span>
                    <div
                      onClick={() =>
                        setInspectPhotoUrl({
                          url: req.profilePhoto,
                          title: `${req.userName} - Profile Photo`,
                        })
                      }
                      className="h-32 rounded-2xl overflow-hidden border border-purple-900 bg-black cursor-pointer group relative"
                    >
                      <img
                        src={req.profilePhoto}
                        alt="profile"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Eye className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 block">
                      2. Live Selfie Camera
                    </span>
                    <div
                      onClick={() =>
                        setInspectPhotoUrl({
                          url: req.liveSelfiePhoto,
                          title: `${req.userName} - Live Selfie Camera`,
                        })
                      }
                      className="h-32 rounded-2xl overflow-hidden border border-emerald-700/50 bg-black cursor-pointer group relative"
                    >
                      <img
                        src={req.liveSelfiePhoto}
                        alt="selfie"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Eye className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>

                  {req.studentIdPhoto && (
                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold text-cyan-400 block">
                        3. UniAbuja ID Card
                      </span>
                      <div
                        onClick={() =>
                          setInspectPhotoUrl({
                            url: req.studentIdPhoto!,
                            title: `${req.userName} - UniAbuja Student ID Card`,
                          })
                        }
                        className="h-32 rounded-2xl overflow-hidden border border-cyan-700/50 bg-black cursor-pointer group relative"
                      >
                        <img
                          src={req.studentIdPhoto}
                          alt="id"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Admin Note if Rejected */}
                {req.adminNote && (
                  <p className="text-[11px] text-rose-300 bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/40">
                    <strong className="text-rose-200">Admin Log Note:</strong> {req.adminNote}
                  </p>
                )}

                {/* Action Controls */}
                <div className="flex items-center space-x-2 pt-2 border-t border-purple-950">
                  {req.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => {
                          approveVerification(req.id);
                          showToast(`Badge granted to ${req.userName} 🛡️`);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Grant Badge</span>
                      </button>

                      <button
                        onClick={() => setSelectedRejectReq(req)}
                        className="py-2 px-3 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-700/40 text-rose-300 font-bold text-xs flex items-center justify-center space-x-1 transition-all"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-between text-xs text-neutral-400">
                      <span>Status recorded: <strong className="text-white capitalize">{req.status}</strong></span>
                      <button
                        onClick={() => {
                          if (req.status === 'approved') {
                            setSelectedRejectReq(req);
                          } else {
                            approveVerification(req.id);
                            showToast(`Status overturned to Approved for ${req.userName} 🛡️`);
                          }
                        }}
                        className="text-purple-400 font-bold hover:underline"
                      >
                        Change Status
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SAFETY & DISCIPLINARY REPORTS                                     */}
      {/* ========================================================================= */}
      {activeAdminTab === 'reports' && (
        <div className="space-y-3">
          {/* Sub-status Filter Buttons */}
          <div className="flex items-center space-x-1.5 pb-1 overflow-x-auto no-scrollbar text-xs">
            {(['pending', 'banned', 'resolved', 'all'] as const).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setReportFilter(filterType)}
                className={`px-3 py-1 rounded-xl font-bold capitalize transition-all ${
                  reportFilter === filterType
                    ? 'bg-purple-900/90 text-white border border-purple-500/50 shadow-sm'
                    : 'bg-[#140825] text-neutral-400 hover:text-neutral-200 border border-purple-950'
                }`}
              >
                {filterType === 'pending'
                  ? `Pending Review (${reports.filter((r) => r.status === 'pending').length})`
                  : filterType}
              </button>
            ))}
          </div>

          {filteredReports.length === 0 ? (
            <div className="p-8 text-center bg-[#120620] rounded-3xl border border-purple-950 text-neutral-400 text-xs space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-60" />
              <p>No safety reports matching "{reportFilter}".</p>
              {reportFilter !== 'all' && (
                <button
                  onClick={() => setReportFilter('all')}
                  className="text-purple-400 font-bold hover:underline text-xs"
                >
                  View all reports
                </button>
              )}
            </div>
          ) : (
            filteredReports.map((rep) => (
              <motion.div
                key={rep.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-3xl bg-[#140825] border border-purple-900/40 space-y-3 shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {rep.targetPhoto && (
                      <img
                        src={rep.targetPhoto}
                        alt=""
                        className="w-11 h-11 rounded-2xl object-cover border border-purple-900 shrink-0"
                      />
                    )}
                    <div>
                      <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-wider block">
                        Reason: {rep.reason.replace('_', ' ')}
                      </span>
                      <h4 className="text-xs font-bold text-white mt-0.5">
                        Reported Student: <span className="text-purple-300">{rep.targetUserName}</span>{' '}
                        <span className="font-mono text-neutral-400">(@{rep.targetUsername})</span>
                      </h4>
                      <p className="text-[10px] text-neutral-400">
                        Filed by: {rep.reporterName} • {new Date(rep.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      rep.status === 'banned'
                        ? 'bg-rose-950 text-rose-300 border border-rose-600'
                        : rep.status === 'resolved'
                        ? 'bg-neutral-900 text-neutral-400'
                        : 'bg-amber-950 text-amber-300 border border-amber-600 animate-pulse'
                    }`}
                  >
                    {rep.status}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-black/40 border border-purple-950 text-xs text-neutral-200">
                  <span className="font-semibold text-neutral-400 text-[10px] block mb-1">
                    Student Witness Evidence & Details:
                  </span>
                  "{rep.details}"
                </div>

                {rep.status === 'pending' ? (
                  <div className="flex items-center space-x-2 pt-1 border-t border-purple-950">
                    <button
                      onClick={() => {
                        resolveReport(rep.id, 'ban');
                        showToast(`Student ${rep.targetUserName} suspended & banned.`);
                      }}
                      className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md transition-all"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Ban & Suspend Student</span>
                    </button>

                    <button
                      onClick={() => {
                        resolveReport(rep.id, 'dismiss');
                        showToast('Report dismissed as insufficient evidence.');
                      }}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold border border-purple-900/40"
                    >
                      Dismiss Report
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
                    <span>Resolution: <strong className="text-white capitalize">{rep.status}</strong></span>
                    <button
                      onClick={() => {
                        resolveReport(rep.id, rep.status === 'banned' ? 'dismiss' : 'ban');
                        showToast('Report status updated.');
                      }}
                      className="text-purple-400 font-bold hover:underline"
                    >
                      Toggle Action
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STUDENT DIRECTORY & ACCOUNT CONTROL                                */}
      {/* ========================================================================= */}
      {activeAdminTab === 'users' && (
        <div className="space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
            <input
              type="text"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              placeholder="Search by name, username, department, or faculty..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#140825] border border-purple-900/60 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 shadow-inner"
            />
            {userSearchQuery && (
              <button
                onClick={() => setUserSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick status filters */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar text-xs pb-1">
            {(['all', 'verified', 'unverified', 'banned', 'lowkey'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setUserStatusFilter(st)}
                className={`px-3 py-1 rounded-xl font-bold capitalize transition-all ${
                  userStatusFilter === st
                    ? 'bg-purple-900/90 text-white border border-purple-500/50 shadow-sm'
                    : 'bg-[#140825] text-neutral-400 hover:text-neutral-200 border border-purple-950'
                }`}
              >
                {st === 'lowkey' ? 'Lowkey Mode 🔒' : st}
              </button>
            ))}
          </div>

          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center bg-[#120620] rounded-3xl border border-purple-950 text-neutral-400 text-xs">
              No students found matching your search.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    user.isBanned
                      ? 'bg-rose-950/20 border-rose-900/40'
                      : 'bg-[#130722] border-purple-950 hover:border-purple-900/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={user.photos[0]}
                      alt=""
                      className="w-12 h-12 rounded-2xl object-cover border border-purple-800 shrink-0"
                    />
                    <div>
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <span className="font-black text-xs text-white">
                          {user.name}, {user.age}
                        </span>
                        {user.isVerified && (
                          <span
                            className="p-0.5 rounded-full bg-purple-950 text-purple-400 border border-purple-800"
                            title="Verified Student"
                          >
                            <ShieldCheck className="w-3 h-3" />
                          </span>
                        )}
                        {user.mode === 'lowkey' && (
                          <span
                            className="p-0.5 rounded-full bg-fuchsia-950 text-fuchsia-400 border border-fuchsia-800"
                            title="Lowkey Mode Active"
                          >
                            <Lock className="w-3 h-3" />
                          </span>
                        )}
                        {user.isBanned && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-rose-950 text-rose-300 border border-rose-700">
                            SUSPENDED
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-purple-300 font-mono mt-0.5">
                        @{user.username} • {user.level} {user.department}
                      </p>
                      <p className="text-[10px] text-neutral-400 truncate max-w-[280px]">
                        {user.faculty} • {user.campusLocation}
                      </p>
                    </div>
                  </div>

                  {/* Direct Admin Control Actions */}
                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                    {/* Toggle Verification Badge */}
                    <button
                      onClick={() => {
                        toggleUserVerification(user.id);
                        showToast(
                          user.isVerified
                            ? `Revoked verified badge for ${user.name}`
                            : `Granted verified badge to ${user.name} 🛡️`
                        );
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center space-x-1 border transition-all ${
                        user.isVerified
                          ? 'bg-purple-950/80 text-purple-300 border-purple-700 hover:bg-purple-900'
                          : 'bg-emerald-950/80 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>{user.isVerified ? 'Revoke Badge' : 'Verify ID'}</span>
                    </button>

                    {/* Ban / Unban Button */}
                    {user.isBanned ? (
                      <button
                        onClick={() => {
                          unbanUser(user.id);
                          showToast(`Restored account for ${user.name} ✅`);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-900/80 text-emerald-200 border border-emerald-600 text-[10px] font-bold hover:bg-emerald-800 transition-all flex items-center space-x-1"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Unban</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          banUser(user.id);
                          showToast(`Suspended ${user.name} ⛔`);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-950/80 text-rose-300 border border-rose-700/50 text-[10px] font-bold hover:bg-rose-900 transition-all flex items-center space-x-1"
                      >
                        <UserX className="w-3 h-3" />
                        <span>Suspend</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GOSSIP & TEA BOARD MODERATION                                     */}
      {/* ========================================================================= */}
      {activeAdminTab === 'gossip' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs text-purple-300 font-bold">
              Live Campus Tea Feed ({gossipPosts.length} posts)
            </span>
            <span className="text-[10px] text-neutral-400">
              Click delete to purge harassment or rule violations
            </span>
          </div>

          {gossipPosts.length === 0 ? (
            <div className="p-8 text-center bg-[#120620] rounded-3xl border border-purple-950 text-neutral-400 text-xs">
              No gossip posts currently on board.
            </div>
          ) : (
            gossipPosts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-3xl bg-[#140825] border border-purple-900/40 space-y-2.5 shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 text-[10px] font-bold border border-purple-800">
                      {post.tag}
                    </span>
                    <span className="text-xs font-bold text-neutral-300">
                      {post.isAnonymous ? post.anonymousAlias || 'Anonymous Student' : post.authorName}
                    </span>
                    <span className="text-[10px] text-neutral-500">• {post.timeAgo}</span>
                  </div>

                  <button
                    onClick={() => {
                      deleteGossipPost(post.id);
                      showToast('Gossip post deleted from board 🗑️');
                    }}
                    className="p-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/40 text-xs transition-all flex items-center space-x-1"
                    title="Delete Gossip Post"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">Delete</span>
                  </button>
                </div>

                <p className="text-xs text-neutral-200 leading-relaxed">
                  "{post.content}"
                </p>

                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt="attachment"
                    className="h-28 rounded-2xl object-cover border border-purple-900"
                  />
                )}

                <div className="flex items-center space-x-3 text-[10px] text-neutral-400 pt-1">
                  <span>🌶️ {post.spicyCount}</span>
                  <span>🧢 {post.capCount}</span>
                  <span>💯 {post.factsCount}</span>
                  <span>☕ {post.teaCount}</span>
                  <span>💬 {post.comments.length} comments</span>
                  <span>👁️ {post.viewsCount} views</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CAMPUS BROADCASTS & POLLS MANAGER                                 */}
      {/* ========================================================================= */}
      {activeAdminTab === 'broadcasts' && (
        <div className="space-y-4">
          {/* Quick Broadcast Composer Card */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-950 via-[#18082d] to-fuchsia-950 border border-purple-800/60 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Megaphone className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-black text-white">Campus-Wide Announcement Broadcast</h3>
              </div>
              <span className="text-[10px] text-purple-300 font-bold px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-700">
                Official Dean's Office
              </span>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-2.5">
              <input
                type="text"
                value={broadcastHeadline}
                onChange={(e) => setBroadcastHeadline(e.target.value)}
                placeholder="Announcement Headline (e.g., SUG Election Night or Campus Safety Notice)..."
                className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-purple-900 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-400"
              />

              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                rows={2}
                placeholder="Broadcast details sent to all verified students..."
                className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-purple-900 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-400 resize-none"
              />

              <button
                type="submit"
                disabled={!broadcastHeadline.trim() || !broadcastMessage.trim()}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Broadcast to Main & Mini Campus</span>
              </button>
            </form>
          </div>

          {/* Campus Polls Management */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <BarChart2 className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  Active UniAbuja Polls ({campusPolls.length})
                </h3>
              </div>
              <span className="text-[10px] text-neutral-400">Live voting results</span>
            </div>

            {campusPolls.map((poll) => (
              <div
                key={poll.id}
                className="p-4 rounded-3xl bg-[#130722] border border-purple-950 space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-purple-400">
                      {poll.category} • {poll.totalVotes} total votes
                    </span>
                    <h4 className="text-xs font-bold text-white mt-0.5">
                      {poll.question}
                    </h4>
                  </div>

                  <button
                    onClick={() => {
                      deleteCampusPoll(poll.id);
                      showToast('Poll removed from student feed 🗑️');
                    }}
                    className="p-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/40 text-xs"
                    title="Delete Poll"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Poll Options Breakdown */}
                <div className="space-y-1.5">
                  {poll.options.map((opt) => {
                    const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                    return (
                      <div key={opt.id} className="space-y-0.5">
                        <div className="flex justify-between text-[11px] text-neutral-300">
                          <span>{opt.text}</span>
                          <span className="font-mono text-purple-300">{opt.votes} ({pct}%)</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-black overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REJECTION REASON MODAL                                                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedRejectReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl bg-[#150727] border border-purple-800 p-5 space-y-4 shadow-2xl text-white"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-rose-400">
                  <XCircle className="w-5 h-5" />
                  <h3 className="text-sm font-black">Reject Verification</h3>
                </div>
                <button
                  onClick={() => setSelectedRejectReq(null)}
                  className="p-1 rounded-full hover:bg-white/10 text-neutral-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-neutral-300">
                Provide reason for rejecting <strong>{selectedRejectReq.userName}</strong> (
                @{selectedRejectReq.username}):
              </p>

              {/* Preset selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-purple-400 block">
                  Select Preset Reason:
                </label>
                {[
                  'Face angle mismatch with profile photos',
                  'Blurry or unreadable UniAbuja Student ID',
                  'Name, username, or identity details do not match',
                  'Inappropriate or non-student photo',
                ].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setRejectReasonPreset(preset)}
                    className={`w-full text-left p-2 rounded-xl text-xs transition-all border ${
                      rejectReasonPreset === preset
                        ? 'bg-purple-900/60 border-purple-500 text-white font-bold'
                        : 'bg-black/30 border-purple-950 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Custom note */}
              <div>
                <label className="text-[10px] font-bold uppercase text-purple-400 block mb-1">
                  Or Custom Feedback:
                </label>
                <input
                  type="text"
                  value={customRejectNote}
                  onChange={(e) => setCustomRejectNote(e.target.value)}
                  placeholder="Optional extra instructions for student..."
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-purple-900 text-xs text-white placeholder-neutral-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  onClick={() => setSelectedRejectReq(null)}
                  className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md"
                >
                  Confirm Rejection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* PHOTO INSPECTION / ZOOM MODAL                                             */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {inspectPhotoUrl && (
          <div
            onClick={() => setInspectPhotoUrl(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-md w-full rounded-3xl bg-[#120620] border border-purple-800 p-4 space-y-3 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300">{inspectPhotoUrl.title}</span>
                <button
                  onClick={() => setInspectPhotoUrl(null)}
                  className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden max-h-[70vh] bg-black flex items-center justify-center border border-purple-900">
                <img
                  src={inspectPhotoUrl.url}
                  alt="zoom"
                  className="max-h-[68vh] w-auto object-contain"
                />
              </div>

              <p className="text-[10px] text-neutral-400 text-center">
                High-resolution verification inspection preview. Tap anywhere outside to close.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
