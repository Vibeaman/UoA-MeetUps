import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Camera,
  GraduationCap,
  MapPin,
  Lock,
  Flame,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FACULTIES_AND_DEPARTMENTS, PROMPT_QUESTIONS } from '../data/mockData';
import { UserProfile, Gender, LookingFor, StudentLevel, CampusLocation, AppMode } from '../types';

export const ProfileEditModal: React.FC = () => {
  const {
    isProfileEditModalOpen,
    setIsProfileEditModalOpen,
    currentUser,
    updateCurrentUser,
  } = useApp();

  const [formData, setFormData] = useState<UserProfile>({ ...currentUser });
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [activePromptQuestion, setActivePromptQuestion] = useState(PROMPT_QUESTIONS[0]);
  const [activePromptAnswer, setActivePromptAnswer] = useState('');

  if (!isProfileEditModalOpen) return null;

  const currentFacultyObj = FACULTIES_AND_DEPARTMENTS.find(
    (f) => f.faculty === formData.faculty
  );
  const departments = currentFacultyObj ? currentFacultyObj.departments : [];

  const handleAddPhoto = () => {
    if (!newPhotoUrl.trim()) return;
    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, newPhotoUrl.trim()],
    }));
    setNewPhotoUrl('');
  };

  const handleRemovePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleAddPrompt = () => {
    if (!activePromptAnswer.trim()) return;
    const newPrompt = {
      id: `p_${Date.now()}`,
      question: activePromptQuestion,
      answer: activePromptAnswer.trim(),
    };
    setFormData((prev) => ({
      ...prev,
      icebreakerPrompts: [...(prev.icebreakerPrompts || []).slice(0, 4), newPrompt],
    }));
    setActivePromptAnswer('');
  };

  const handleRemovePrompt = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      icebreakerPrompts: (prev.icebreakerPrompts || []).filter((p) => p.id !== id),
    }));
  };

  const handleAddInterest = () => {
    if (!newInterest.trim()) return;
    setFormData((prev) => ({
      ...prev,
      interests: [...(prev.interests || []), newInterest.trim()],
    }));
    setNewInterest('');
  };

  const handleRemoveInterest = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: (prev.interests || []).filter((t) => t !== tag),
    }));
  };

  const handleSave = () => {
    updateCurrentUser(formData);
    setIsProfileEditModalOpen(false);
  };

  const campusLocations: CampusLocation[] = [
    'Main Campus',
    'Mini Campus',
    'Permanent Site',
    'Off-Campus',
    'Hostel (Male Block)',
    'Hostel (Female Block)',
  ];

  const levels: StudentLevel[] = ['100L', '200L', '300L', '400L', '500L'];
  const genders: Gender[] = ['Male', 'Female', 'Non-binary', 'Prefer not to say', 'Other'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0e051a] border border-purple-900/50 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-purple-950/80">
          <div>
            <h2 className="text-xl font-black font-display text-white">Edit Student Profile</h2>
            <p className="text-xs text-purple-300">Customize your photos, bio & prompts</p>
          </div>
          <button
            onClick={() => setIsProfileEditModalOpen(false)}
            className="p-2 rounded-full bg-white/5 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-5 text-xs text-neutral-200">
          {/* Photo Management */}
          <div>
            <label className="block text-[11px] font-bold text-purple-300 uppercase mb-2">
              Profile Photos ({formData.photos.length}/6)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {formData.photos.map((url, i) => (
                <div key={i} className="relative h-28 rounded-2xl overflow-hidden border border-purple-800 group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(i)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-rose-400 hover:bg-rose-900 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-purple-900/90 text-white text-[9px] font-bold">
                      Main Photo
                    </span>
                  )}
                </div>
              ))}

              {formData.photos.length < 6 && (
                <div className="h-28 rounded-2xl border-2 border-dashed border-purple-900/60 bg-purple-950/20 flex flex-col items-center justify-center p-2 text-center">
                  <input
                    type="text"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="Paste image URL..."
                    className="w-full text-[10px] p-1 rounded bg-[#150826] border border-purple-900 text-white mb-1.5"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    disabled={!newPhotoUrl.trim()}
                    className="px-2 py-1 rounded bg-purple-600 text-white text-[10px] font-bold hover:bg-purple-500 disabled:opacity-30"
                  >
                    + Add
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Name & Age */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-purple-300 uppercase mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#140824] border border-purple-900/50 text-white focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-purple-300 uppercase mb-1">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 20 })}
                className="w-full p-2.5 rounded-xl bg-[#140824] border border-purple-900/50 text-white focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-[11px] font-bold text-purple-300 uppercase mb-1">Bio</label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell other students about yourself, campus routine, interests..."
              className="w-full p-2.5 rounded-xl bg-[#140824] border border-purple-900/50 text-white focus:outline-none focus:border-purple-400"
            />
          </div>

          {/* Faculty & Department */}
          <div className="space-y-2">
            <div>
              <label className="block text-[11px] font-bold text-purple-300 uppercase mb-1">Faculty</label>
              <select
                value={formData.faculty}
                onChange={(e) => {
                  const newFac = e.target.value;
                  const newFacObj = FACULTIES_AND_DEPARTMENTS.find((f) => f.faculty === newFac);
                  setFormData({
                    ...formData,
                    faculty: newFac,
                    department: newFacObj ? newFacObj.departments[0] : '',
                  });
                }}
                className="w-full p-2.5 rounded-xl bg-[#140824] border border-purple-900/50 text-white"
              >
                {FACULTIES_AND_DEPARTMENTS.map((f) => (
                  <option key={f.faculty} value={f.faculty}>
                    {f.faculty}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-purple-300 uppercase mb-1">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#140824] border border-purple-900/50 text-white"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Level & Campus Location */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-purple-300 uppercase mb-1">Level</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value as StudentLevel })}
                className="w-full p-2.5 rounded-xl bg-[#140824] border border-purple-900/50 text-white"
              >
                {levels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-purple-300 uppercase mb-1">Location</label>
              <select
                value={formData.campusLocation}
                onChange={(e) => setFormData({ ...formData, campusLocation: e.target.value as CampusLocation })}
                className="w-full p-2.5 rounded-xl bg-[#140824] border border-purple-900/50 text-white"
              >
                {campusLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mode & Looking For */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-purple-300 uppercase mb-1">Profile Mode</label>
              <select
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value as AppMode })}
                className="w-full p-2.5 rounded-xl bg-[#140824] border border-purple-900/50 text-white"
              >
                <option value="normal">Normal Mode 💜</option>
                <option value="lowkey">Lowkey Mode 🔒</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-purple-300 uppercase mb-1">Looking For</label>
              <select
                value={formData.lookingFor}
                onChange={(e) => setFormData({ ...formData, lookingFor: e.target.value as LookingFor })}
                className="w-full p-2.5 rounded-xl bg-[#140824] border border-purple-900/50 text-white"
              >
                <option value="dating">Dating 🥂</option>
                <option value="lowkey">Lowkey 🔒</option>
                <option value="both">Both 💜</option>
              </select>
            </div>
          </div>

          {/* Icebreaker Prompts Customizer */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-purple-300 uppercase flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Icebreaker Prompts (Up to 5)</span>
            </label>

            {formData.icebreakerPrompts && formData.icebreakerPrompts.length > 0 && (
              <div className="space-y-2">
                {formData.icebreakerPrompts.map((p) => (
                  <div key={p.id} className="p-3 rounded-xl bg-[#180a2c] border border-purple-900 flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-purple-300 block">{p.question}</span>
                      <p className="text-white mt-0.5">"{p.answer}"</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePrompt(p.id)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {(!formData.icebreakerPrompts || formData.icebreakerPrompts.length < 5) && (
              <div className="p-3 rounded-2xl bg-[#140824] border border-purple-950 space-y-2">
                <select
                  value={activePromptQuestion}
                  onChange={(e) => setActivePromptQuestion(e.target.value)}
                  className="w-full p-2 rounded-xl bg-[#0e051a] border border-purple-900 text-white text-xs"
                >
                  {PROMPT_QUESTIONS.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={activePromptAnswer}
                  onChange={(e) => setActivePromptAnswer(e.target.value)}
                  placeholder="Your witty response..."
                  className="w-full p-2 rounded-xl bg-[#0e051a] border border-purple-900 text-white text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddPrompt}
                  disabled={!activePromptAnswer.trim()}
                  className="w-full py-1.5 rounded-xl bg-purple-800 text-white font-bold hover:bg-purple-700 disabled:opacity-40"
                >
                  + Add Prompt
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Save Footer */}
        <div className="pt-3 border-t border-purple-950/80 flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsProfileEditModalOpen(false)}
            className="px-4 py-3 rounded-2xl bg-white/5 text-neutral-400 font-semibold hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold shadow-lg shadow-purple-900/40 hover:brightness-110 flex items-center justify-center space-x-1.5"
            id="save-profile-btn"
          >
            <Check className="w-4 h-4" />
            <span>Save Profile Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
