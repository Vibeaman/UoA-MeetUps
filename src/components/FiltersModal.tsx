import React, { useState } from 'react';
import {
  X,
  SlidersHorizontal,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Check,
  Search,
  Building,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FACULTIES_AND_DEPARTMENTS } from '../data/catalogData';
import { StudentLevel } from '../types';

export const FiltersModal: React.FC = () => {
  const {
    isFiltersModalOpen,
    setIsFiltersModalOpen,
    filters,
    setFilters,
    resetFilters,
    currentUser,
  } = useApp();

  const [localFilters, setLocalFilters] = useState(filters);

  if (!isFiltersModalOpen) return null;

  const currentFacultyObj = FACULTIES_AND_DEPARTMENTS.find(
    (f) => f.faculty === localFilters.faculty
  );

  const availableDepts = currentFacultyObj ? currentFacultyObj.departments : [];

  const handleApply = () => {
    setFilters(localFilters);
    setIsFiltersModalOpen(false);
  };

  const handleReset = () => {
    resetFilters();
    setLocalFilters({
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

  const levels: StudentLevel[] = ['100L', '200L', '300L', '400L', '500L'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0d0518] border border-orange-900/50 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-orange-950/60">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-orange-950/80 text-orange-400 border border-orange-800/40">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-black font-display text-white">Discovery Filters</h2>
              <p className="text-xs text-neutral-400">Target specific UniAbuja students</p>
            </div>
          </div>

          <button
            onClick={() => setIsFiltersModalOpen(false)}
            className="p-2 rounded-full bg-white/5 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Filters Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-5">
          {/* Search bar */}
          <div>
            <label className="block text-xs font-bold text-orange-300 uppercase tracking-wider mb-1.5">
              Search by Keyword
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                value={localFilters.searchQuery}
                onChange={(e) => setLocalFilters({ ...localFilters, searchQuery: e.target.value })}
                placeholder="Name, course, department, or hobbies..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#1a0b22] border border-orange-900/50 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-400"
              />
            </div>
          </div>

          {/* Quick 1-Tap Campus Filters */}
          <div>
            <label className="block text-xs font-bold text-orange-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>UniAbuja Quick Filters</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    onlyMyFaculty: !prev.onlyMyFaculty,
                    onlyMyDepartment: false,
                  }))
                }
                className={`p-3 rounded-2xl border text-left flex items-start space-x-2.5 transition-all ${
                  localFilters.onlyMyFaculty
                    ? 'bg-orange-900/60 border-orange-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : 'bg-[#1a0b22] border-orange-950 text-neutral-300 hover:border-orange-800'
                }`}
              >
                <Building className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold block">My Faculty Only</span>
                  <span className="text-[10px] text-neutral-400">{currentUser.faculty}</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    onlyMyDepartment: !prev.onlyMyDepartment,
                    onlyMyFaculty: false,
                  }))
                }
                className={`p-3 rounded-2xl border text-left flex items-start space-x-2.5 transition-all ${
                  localFilters.onlyMyDepartment
                    ? 'bg-orange-900/60 border-orange-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : 'bg-[#1a0b22] border-orange-950 text-neutral-300 hover:border-orange-800'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold block">My Department Only</span>
                  <span className="text-[10px] text-neutral-400">{currentUser.department}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Gender Filter */}
          <div>
            <label className="block text-xs font-bold text-orange-300 uppercase tracking-wider mb-2">
              Interested in
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {['all', 'Female', 'Male', 'Non-binary'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setLocalFilters({ ...localFilters, gender: g })}
                  className={`py-2 rounded-xl text-xs font-semibold capitalize border transition-all ${
                    localFilters.gender === g
                      ? 'bg-orange-600 text-white border-orange-400 shadow-sm'
                      : 'bg-[#130722] border-orange-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  {g === 'all' ? 'Everyone' : g}
                </button>
              ))}
            </div>
          </div>

          {/* Academic Level */}
          <div>
            <label className="block text-xs font-bold text-orange-300 uppercase tracking-wider mb-2">
              Academic Level
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setLocalFilters({ ...localFilters, level: 'all' })}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                  localFilters.level === 'all'
                    ? 'bg-orange-600 text-white border-orange-400'
                    : 'bg-[#130722] border-orange-950 text-neutral-400 hover:text-white'
                }`}
              >
                All Levels
              </button>
              {levels.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLocalFilters({ ...localFilters, level: lvl })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    localFilters.level === lvl
                      ? 'bg-orange-600 text-white border-orange-400'
                      : 'bg-[#130722] border-orange-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Faculty Dropdown */}
          <div>
            <label className="block text-xs font-bold text-orange-300 uppercase tracking-wider mb-1.5">
              Specific Faculty
            </label>
            <select
              value={localFilters.faculty}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  faculty: e.target.value,
                  department: 'all',
                  onlyMyFaculty: false,
                  onlyMyDepartment: false,
                })
              }
              className="w-full p-2.5 rounded-xl bg-[#1a0b22] border border-orange-900/50 text-xs text-white focus:outline-none focus:border-orange-400"
            >
              <option value="all">All UniAbuja Faculties</option>
              {FACULTIES_AND_DEPARTMENTS.map((f) => (
                <option key={f.faculty} value={f.faculty}>
                  {f.faculty}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Department Dropdown */}
          {localFilters.faculty !== 'all' && availableDepts.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-orange-300 uppercase tracking-wider mb-1.5">
                Department in {localFilters.faculty}
              </label>
              <select
                value={localFilters.department}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    department: e.target.value,
                    onlyMyDepartment: false,
                  })
                }
                className="w-full p-2.5 rounded-xl bg-[#1a0b22] border border-orange-900/50 text-xs text-white focus:outline-none focus:border-orange-400"
              >
                <option value="all">All Departments in Faculty</option>
                {availableDepts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Only Verified Toggle */}
          <div className="p-3 rounded-2xl bg-[#1a0b22] border border-orange-950 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              <div>
                <span className="text-xs font-bold text-white block">Only Verified Students</span>
                <span className="text-[10px] text-neutral-400">Show profiles with facial verification badge</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setLocalFilters((prev) => ({ ...prev, onlyVerified: !prev.onlyVerified }))
              }
              className={`w-10 h-6 rounded-full transition-colors relative ${
                localFilters.onlyVerified ? 'bg-orange-600' : 'bg-neutral-800'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  localFilters.onlyVerified ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-orange-950/60 flex items-center space-x-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl bg-white/5 text-neutral-400 text-xs font-semibold hover:text-white flex items-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-900/40 hover:brightness-110 transition-all flex items-center justify-center space-x-1.5"
            id="apply-filters-btn"
          >
            <Check className="w-4 h-4" />
            <span>Apply Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
};
