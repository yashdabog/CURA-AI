import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, CheckCircle2, Clock, Users, Database, Calendar, Heart,
  Settings as SettingsIcon, AlertTriangle, ChevronRight, Filter, Plus, Edit3, Trash2, Eye, Check, X,
  Search, Play, Sparkles, Sliders, Activity, Info
} from 'lucide-react';
import {
  fetchProfile, updateProfile, fetchAlerts, acknowledgeAlert, escalateAlert,
  fetchMemories, createMemory, verifyMemory, updateMemory,
  fetchRoutines, createRoutine, fetchFamilyGuide, fetchTimeline, fetchAuditLog,
  sendChatMessage
} from '../services/api';
import { useCuraStore } from '../store/useCuraStore';

export default function CaregiverDashboardView() {
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [activeTab, setActiveTab] = useState('today'); // today | vault | routines | contacts | family | simulator | settings | audit

  const [profile, setProfile] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [timelineData, setTimelineData] = useState({ messages: [], alerts: [], routines: [] });
  const [memories, setMemories] = useState([]);
  const [vaultFilter, setVaultFilter] = useState('all');
  const [vaultSearch, setVaultSearch] = useState('');
  const [routines, setRoutines] = useState([]);
  const [familyGuide, setFamilyGuide] = useState({ guide_cards: [], next_scheduled_call: '' });
  const [auditLogs, setAuditLogs] = useState([]);

  // Simulation test response output
  const [simOutput, setSimOutput] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  // Memory form state
  const [showAddMemModal, setShowAddMemModal] = useState(false);
  const [editingMem, setEditingMem] = useState(null);
  const [memForm, setMemForm] = useState({
    type: 'person',
    title: '',
    content: '',
    related_people: '',
    source: 'caregiver',
    verification_state: 'verified'
  });

  // Routine form state
  const [showAddRtModal, setShowAddRtModal] = useState(false);
  const [rtForm, setRtForm] = useState({
    title: '',
    time: '09:00',
    type: 'medication',
    critical: true,
    snooze_minutes: 15,
    snooze_limit: 2,
    escalation_after_n_misses: 2
  });

  useEffect(() => {
    if (authenticated) {
      loadDashboardData();
    }
  }, [authenticated, activeTab, vaultFilter]);

  const loadDashboardData = async () => {
    try {
      const p = await fetchProfile();
      setProfile(p);
      const a = await fetchAlerts(false);
      setAlerts(a);
      const t = await fetchTimeline();
      setTimelineData(t);
      const m = await fetchMemories(vaultFilter === 'pending' ? 'all' : vaultFilter, vaultFilter === 'pending');
      setMemories(m);
      const r = await fetchRoutines();
      setRoutines(r);
      const fg = await fetchFamilyGuide();
      setFamilyGuide(fg);
      const logs = await fetchAuditLog();
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed loading dashboard data:', err);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === 'cura123' || passwordInput === 'admin' || passwordInput === 'demo') {
      setAuthenticated(true);
    } else {
      alert('Incorrect password. (Demo password: cura123)');
    }
  };

  const handleStageChange = async (newStage) => {
    if (!profile) return;
    try {
      const updated = await updateProfile({ ...profile, stage: newStage });
      setProfile(updated);
      loadDashboardData();
    } catch (err) {
      console.error('Failed updating stage:', err);
    }
  };

  const handleAckAlert = async (alertId) => {
    try {
      await acknowledgeAlert(alertId, 'Yokeshwaran (Caregiver)');
      loadDashboardData();
    } catch (err) {
      console.error('Ack error:', err);
    }
  };

  const handleSaveMemory = async (e) => {
    e.preventDefault();
    try {
      const peopleList = memForm.related_people.split(',').map(s => s.trim()).filter(Boolean);
      if (editingMem) {
        await updateMemory(editingMem.id, {
          ...memForm,
          related_people: peopleList
        });
      } else {
        await createMemory({
          ...memForm,
          related_people: peopleList
        });
      }
      setShowAddMemModal(false);
      setEditingMem(null);
      setMemForm({ type: 'person', title: '', content: '', related_people: '', source: 'caregiver', verification_state: 'verified' });
      loadDashboardData();
    } catch (err) {
      console.error('Save memory error:', err);
    }
  };

  const handleVerifyMem = async (memId) => {
    try {
      await verifyMemory(memId);
      loadDashboardData();
    } catch (err) {
      console.error('Verify memory error:', err);
    }
  };

  const handleSaveRoutine = async (e) => {
    e.preventDefault();
    try {
      await createRoutine(rtForm);
      setShowAddRtModal(false);
      setRtForm({ title: '', time: '09:00', type: 'medication', critical: true, snooze_minutes: 15, snooze_limit: 2, escalation_after_n_misses: 2 });
      loadDashboardData();
    } catch (err) {
      console.error('Save routine error:', err);
    }
  };

  const runSimulationTurn = async (promptText, overrideTime = null) => {
    setSimLoading(true);
    try {
      const res = await sendChatMessage(promptText, overrideTime);
      setSimOutput(res);
      await loadDashboardData();
    } catch (err) {
      console.error('Sim error:', err);
    } finally {
      setSimLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-gray-200 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#E07856] text-white flex items-center justify-center mx-auto shadow-md">
            <Heart className="w-9 h-9" />
          </div>
          <h2 className="text-3xl font-bold text-[#2B2622]">Caregiver Dashboard</h2>
          <p className="text-[#6B6259]">Protected Caregiver Portal for Varsha</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Enter demo password (cura123)"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-gray-300 text-lg focus:outline-none focus:ring-2 focus:ring-[#E07856]"
            />
            <button
              type="submit"
              className="w-full py-4 bg-[#E07856] hover:bg-[#D06745] text-white font-bold text-lg rounded-2xl shadow-md cursor-pointer transition-all active:scale-95"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  const unackAlerts = alerts.filter(a => !a.acknowledged);

  const filteredMemories = memories.filter(mem => {
    if (!vaultSearch.trim()) return true;
    const s = vaultSearch.lower();
    return mem.title.lower().includes(s) || mem.content.lower().includes(s) || mem.type.lower().includes(s);
  });

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#2B2622] flex flex-col">
      
      {/* Sticky Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E07856] to-amber-500 text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
              V
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#2B2622]">Varsha</h1>
              <p className="text-sm text-[#6B6259]">78 years old • Stage: <span className="font-bold text-[#E07856] uppercase">{profile?.stage}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Interactive Stage Switcher Dropdown */}
            <div className="flex items-center gap-2 bg-[#FAF6EF] px-4 py-2 rounded-2xl border border-gray-200 shadow-inner">
              <span className="text-sm font-semibold text-[#6B6259]">Stage:</span>
              <select
                value={profile?.stage || 'mid'}
                onChange={(e) => handleStageChange(e.target.value)}
                className="bg-transparent font-bold text-[#E07856] text-base focus:outline-none cursor-pointer"
              >
                <option value="early">EARLY (Max 20w)</option>
                <option value="mid">MID (Max 10w)</option>
                <option value="late">LATE (Max 6w)</option>
              </select>
            </div>

            {/* Live Status Pill */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-100 text-emerald-800 font-bold text-sm border border-emerald-300">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span>Status: Calm</span>
            </div>
          </div>
        </div>

        {/* Sticky Alert Bar */}
        {unackAlerts.length > 0 && (
          <div className="bg-rose-600 text-white px-6 py-3 shadow-md flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
              <span className="font-bold text-base">
                {unackAlerts.length} Unacknowledged Alert(s): {unackAlerts[0].message}
              </span>
            </div>
            <button
              onClick={() => handleAckAlert(unackAlerts[0].id)}
              className="bg-white text-rose-600 hover:bg-rose-50 px-4 py-1.5 rounded-xl font-bold text-sm cursor-pointer shadow active:scale-95"
            >
              Acknowledge Alert
            </button>
          </div>
        )}

        {/* Dashboard Navigation Tabs */}
        <nav className="max-w-7xl mx-auto px-6 flex gap-2 overflow-x-auto pt-2">
          {[
            { id: 'today', label: 'Today Timeline', icon: Calendar },
            { id: 'vault', label: 'Memory Vault', icon: Database },
            { id: 'routines', label: 'Routines Grid', icon: Clock },
            { id: 'simulator', label: 'Engine Simulator', icon: Sparkles },
            { id: 'contacts', label: 'Contacts Escalation', icon: Users },
            { id: 'family', label: 'Family Guide', icon: Heart },
            { id: 'settings', label: 'Settings', icon: SettingsIcon },
            { id: 'audit', label: 'Audit Log', icon: ShieldAlert },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-bold text-sm border-b-4 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-[#E07856] text-[#E07856] bg-amber-50/50'
                    : 'border-transparent text-[#6B6259] hover:text-[#2B2622]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full p-6 flex-1">
        
        {/* TAB 1: TODAY TIMELINE */}
        {activeTab === 'today' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Today's Conversational Timeline</h2>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-6">
              {timelineData.messages.length === 0 ? (
                <p className="text-[#6B6259] text-center py-8">No conversation turns recorded today yet.</p>
              ) : (
                <div className="relative border-l-2 border-[#E07856]/30 ml-4 space-y-6 pl-6">
                  {timelineData.messages.map((msg) => (
                    <div key={msg.id} className="relative">
                      <span className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white ${
                        msg.speaker === 'patient' ? 'bg-[#E07856]' : 'bg-emerald-500'
                      }`} />
                      <div className="bg-[#FAF6EF] p-4 rounded-2xl border border-gray-200 hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm text-[#2B2622] capitalize">{msg.speaker}</span>
                          <span className="text-xs text-[#6B6259]">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-base text-[#2B2622] font-medium">{msg.text}</p>
                        {msg.strategy_used && (
                          <div className="mt-2 text-xs font-bold text-[#E07856] bg-amber-100/60 inline-block px-2.5 py-1 rounded-md">
                            Strategy: {msg.strategy_used} (Repetition #{msg.repetition_count})
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MEMORY VAULT */}
        {activeTab === 'vault' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold">Personal Memory Vault</h2>
                <p className="text-sm text-[#6B6259]">Verified ground truths used by CURA for memory prompting and comfort context.</p>
              </div>
              <button
                onClick={() => {
                  setEditingMem(null);
                  setMemForm({ type: 'person', title: '', content: '', related_people: '', source: 'caregiver', verification_state: 'verified' });
                  setShowAddMemModal(true);
                }}
                className="bg-[#E07856] hover:bg-[#D06745] text-white px-5 py-3 rounded-2xl font-bold text-sm inline-flex items-center gap-2 shadow-md cursor-pointer active:scale-95 transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>Add Memory</span>
              </button>
            </div>

            {/* Filter Chips & Instant Search Box */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {['all', 'person', 'place', 'event', 'preference', 'pending'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setVaultFilter(filter)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all cursor-pointer ${
                      vaultFilter === filter
                        ? 'bg-[#E07856] text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-[#6B6259] hover:bg-gray-50'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search memories..."
                  value={vaultSearch}
                  onChange={(e) => setVaultSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#E07856]"
                />
              </div>
            </div>

            {/* Memories List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMemories.map((mem) => (
                <div key={mem.id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg">
                        {mem.type}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        mem.verification_state === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                        mem.verification_state === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {mem.verification_state}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-[#2B2622]">{mem.title}</h3>
                    <p className="text-sm text-[#6B6259] leading-relaxed">{mem.content}</p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-[#6B6259]">
                    <span>Source: {mem.source}</span>
                    {mem.verification_state === 'pending' && (
                      <button
                        onClick={() => handleVerifyMem(mem.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Verify</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ROUTINES GRID */}
        {activeTab === 'routines' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Daily Routine Guardian Grid</h2>
              <button
                onClick={() => setShowAddRtModal(true)}
                className="bg-[#E07856] text-white px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 cursor-pointer shadow-md active:scale-95 transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>Add Routine</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {routines.map((rt) => (
                <div key={rt.id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-extrabold text-[#E07856]">{rt.time}</span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${rt.critical ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-700'}`}>
                      {rt.critical ? 'CRITICAL' : 'Standard'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#2B2622]">{rt.title}</h3>
                    <p className="text-sm text-[#6B6259] capitalize">Type: {rt.type}</p>
                  </div>
                  <div className="text-xs text-[#6B6259] bg-[#FAF6EF] p-3 rounded-xl space-y-1">
                    <p>Snooze limit: {rt.snooze_limit} × {rt.snooze_minutes} min</p>
                    <p>Escalate after {rt.escalation_after_n_misses} misses</p>
                    <p className="font-bold text-rose-600">Current misses: {rt.missed_count}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ENGINE SIMULATOR SUITE */}
        {activeTab === 'simulator' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-[#E07856]" />
                <span>Interactive Cognitive Engine Simulator</span>
              </h2>
              <p className="text-sm text-[#6B6259]">Test how CURA's 7 deterministic engines react in real-time to different patient prompts.</p>
            </div>

            {/* Quick Test Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => runSimulationTurn("Tell me about Yokeshwaran")}
                className="p-4 bg-white hover:bg-amber-50/60 rounded-2xl border border-gray-200 font-bold text-left text-sm flex items-center justify-between cursor-pointer transition-colors shadow-sm"
              >
                <span>🧪 Test Grounding Memory ("Tell me about Yokeshwaran")</span>
                <Play className="w-4 h-4 text-[#E07856]" />
              </button>

              <button
                onClick={() => runSimulationTurn("Where is Yokeshwaran?")}
                className="p-4 bg-white hover:bg-amber-50/60 rounded-2xl border border-gray-200 font-bold text-left text-sm flex items-center justify-between cursor-pointer transition-colors shadow-sm"
              >
                <span>🧪 Test Repetition Strategy ("Where is Yokeshwaran?")</span>
                <Play className="w-4 h-4 text-[#E07856]" />
              </button>

              <button
                onClick={() => runSimulationTurn("Someone is in the house", "17:30")}
                className="p-4 bg-white hover:bg-amber-50/60 rounded-2xl border border-gray-200 font-bold text-left text-sm flex items-center justify-between cursor-pointer transition-colors shadow-sm"
              >
                <span>🧪 Test Fear Hallucination Branch B + Alert at 17:30</span>
                <Play className="w-4 h-4 text-[#E07856]" />
              </button>

              <button
                onClick={() => runSimulationTurn("Is Yashwantha coming home?")}
                className="p-4 bg-white hover:bg-amber-50/60 rounded-2xl border border-gray-200 font-bold text-left text-sm flex items-center justify-between cursor-pointer transition-colors shadow-sm"
              >
                <span>🧪 Test Benign False Belief Branch A ("Is Yashwantha coming home?")</span>
                <Play className="w-4 h-4 text-[#E07856]" />
              </button>
            </div>

            {/* Simulation Results Box */}
            {simLoading && (
              <div className="p-8 text-center bg-white rounded-3xl border border-gray-200 shadow-sm animate-pulse">
                <p className="text-lg font-bold text-[#E07856]">Evaluating deterministic cognitive engines...</p>
              </div>
            )}

            {simOutput && !simLoading && (
              <div className="bg-white p-6 rounded-3xl border-2 border-[#E07856]/40 shadow-lg space-y-4">
                <h3 className="text-lg font-bold text-[#2B2622]">Engine Evaluation Results</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-[#FAF6EF] p-3 rounded-xl">
                    <span className="block text-[#6B6259] font-semibold">Emotion State</span>
                    <span className="font-extrabold text-[#E07856] capitalize">{simOutput.emotion_state}</span>
                  </div>
                  <div className="bg-[#FAF6EF] p-3 rounded-xl">
                    <span className="block text-[#6B6259] font-semibold">Sundowning Active</span>
                    <span className="font-extrabold text-[#2B2622]">{simOutput.sundowning_mode ? 'YES' : 'NO'}</span>
                  </div>
                  <div className="bg-[#FAF6EF] p-3 rounded-xl">
                    <span className="block text-[#6B6259] font-semibold">Repetition Count</span>
                    <span className="font-extrabold text-[#2B2622]">#{simOutput.repetition_count} ({simOutput.strategy_used})</span>
                  </div>
                  <div className="bg-[#FAF6EF] p-3 rounded-xl">
                    <span className="block text-[#6B6259] font-semibold">Hallucination Branch</span>
                    <span className="font-extrabold text-[#2B2622]">{simOutput.hallucination_branch || 'None'}</span>
                  </div>
                </div>

                <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200">
                  <span className="text-xs font-bold text-amber-900 uppercase">Synthesized CURA Output:</span>
                  <p className="text-2xl font-extrabold text-[#2B2622] mt-1">"{simOutput.reply}"</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: CONTACTS ESCALATION */}
        {activeTab === 'contacts' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Emergency & Escalation Contacts</h2>
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <div className="p-4 rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/50 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Primary Caregiver (Order #1)</span>
                  <h3 className="text-xl font-bold text-[#2B2622]">Yokeshwaran</h3>
                  <p className="text-sm text-[#6B6259]">Phone: +1-555-0192 • Email: yokeshwaran@example.com</p>
                </div>
                <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl">Primary</span>
              </div>

              <div className="p-4 rounded-2xl border border-gray-200 bg-[#FAF6EF] flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-[#6B6259] uppercase tracking-wider">Secondary Contact (Order #2)</span>
                  <h3 className="text-xl font-bold text-[#2B2622]">Viswesh</h3>
                  <p className="text-sm text-[#6B6259]">Family Member • Phone: +1-555-0198</p>
                </div>
                <span className="bg-gray-300 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-xl">Secondary</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: FAMILY GUIDE */}
        {activeTab === 'family' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Stage-Adaptive Family Engagement Guide</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {familyGuide.guide_cards.map((card, idx) => (
                <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3">
                  <h3 className="text-lg font-bold text-[#E07856]">{card.title}</h3>
                  <p className="text-sm text-[#6B6259] leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: SETTINGS */}
        {activeTab === 'settings' && profile && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold">Caregiver System Settings</h2>
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#6B6259] mb-1">Sundowning Window (HH:MM)</label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={profile.sundowning_start}
                    onChange={(e) => setProfile({ ...profile, sundowning_start: e.target.value })}
                    className="px-4 py-2 border rounded-xl"
                  />
                  <span className="self-center font-bold">to</span>
                  <input
                    type="text"
                    value={profile.sundowning_end}
                    onChange={(e) => setProfile({ ...profile, sundowning_end: e.target.value })}
                    className="px-4 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <h4 className="font-bold text-lg">Simple Patient UI Mode</h4>
                  <p className="text-sm text-[#6B6259]">Hides extra buttons and simplifies full-screen patient home.</p>
                </div>
                <input
                  type="checkbox"
                  checked={profile.simple_mode}
                  onChange={async (e) => {
                    const updated = await updateProfile({ ...profile, simple_mode: e.target.checked });
                    setProfile(updated);
                  }}
                  className="w-6 h-6 accent-[#E07856]"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: AUDIT LOG */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Append-Only Audit Log Trail</h2>
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FAF6EF] border-b border-gray-200">
                  <tr>
                    <th className="p-4 font-bold text-[#6B6259]">Timestamp</th>
                    <th className="p-4 font-bold text-[#6B6259]">Event Type</th>
                    <th className="p-4 font-bold text-[#6B6259]">Payload Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-amber-50/40">
                      <td className="p-4 text-xs font-mono text-[#6B6259]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4 font-bold text-[#E07856] text-xs uppercase">{log.event_type}</td>
                      <td className="p-4 text-xs font-mono text-[#2B2622]">
                        {JSON.dumps(log.payload)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* Add Memory Modal */}
      {showAddMemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-2xl font-bold">Add Memory to Vault</h3>
            <form onSubmit={handleSaveMemory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#6B6259] mb-1">Type</label>
                <select
                  value={memForm.type}
                  onChange={(e) => setMemForm({ ...memForm, type: e.target.value })}
                  className="w-full p-3 border rounded-xl text-base"
                >
                  <option value="person">Person</option>
                  <option value="place">Place</option>
                  <option value="event">Event</option>
                  <option value="preference">Preference</option>
                  <option value="fact">Fact</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B6259] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={memForm.title}
                  onChange={(e) => setMemForm({ ...memForm, title: e.target.value })}
                  className="w-full p-3 border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B6259] mb-1">Content</label>
                <textarea
                  required
                  rows={3}
                  value={memForm.content}
                  onChange={(e) => setMemForm({ ...memForm, content: e.target.value })}
                  className="w-full p-3 border rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemModal(false)}
                  className="px-5 py-2.5 rounded-xl border font-bold text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#E07856] text-white font-bold text-sm cursor-pointer"
                >
                  Save Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
