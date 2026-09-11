import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useCuraStore } from './store/useCuraStore';
import OnboardingView from './views/OnboardingView';
import PatientHomeView from './views/PatientHomeView';
import CaregiverDashboardView from './views/CaregiverDashboardView';
import FamilyPortalView from './views/FamilyPortalView';
import { Heart, ShieldCheck, Users, Settings } from 'lucide-react';

function NavigationBar() {
  const location = useLocation();
  const { profile } = useCuraStore();

  // Hide nav on simple mode or during onboarding
  if (location.pathname === '/onboarding' || profile?.simple_mode) return null;

  return (
    <div className="bg-[#2B2622] text-white py-2 px-6 flex justify-between items-center text-xs sm:text-sm font-semibold border-b border-white/10">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[#E07856] animate-pulse" />
        <span className="text-[#E07856] font-bold">CURA COMPANION</span>
      </div>
      <nav className="flex items-center gap-4 sm:gap-6">
        <Link
          to="/"
          className={`hover:text-[#E07856] transition-colors ${location.pathname === '/' ? 'text-[#E07856] underline underline-offset-4' : 'text-gray-300'}`}
        >
          Patient Mode
        </Link>
        <Link
          to="/caregiver"
          className={`hover:text-[#E07856] transition-colors ${location.pathname === '/caregiver' ? 'text-[#E07856] underline underline-offset-4' : 'text-gray-300'}`}
        >
          Caregiver Dashboard
        </Link>
        <Link
          to="/family"
          className={`hover:text-[#E07856] transition-colors ${location.pathname === '/family' ? 'text-[#E07856] underline underline-offset-4' : 'text-gray-300'}`}
        >
          Family Portal
        </Link>
        <Link
          to="/onboarding"
          className={`hover:text-[#E07856] transition-colors ${location.pathname === '/onboarding' ? 'text-[#E07856] underline underline-offset-4' : 'text-gray-300'}`}
        >
          Consent Onboarding
        </Link>
      </nav>
    </div>
  );
}

export default function App() {
  const { loadInitialData } = useCuraStore();

  useEffect(() => {
    loadInitialData();
  }, []);

  return (
    <BrowserRouter>
      <NavigationBar />
      <Routes>
        <Route path="/onboarding" element={<OnboardingView />} />
        <Route path="/" element={<PatientHomeView />} />
        <Route path="/caregiver" element={<CaregiverDashboardView />} />
        <Route path="/family" element={<FamilyPortalView />} />
      </Routes>
    </BrowserRouter>
  );
}
