import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Heart, CheckCircle2, ArrowRight } from 'lucide-react';
import { updateProfile, fetchProfile } from '../services/api';
import { useCuraStore } from '../store/useCuraStore';

export default function OnboardingView() {
  const navigate = useNavigate();
  const { loadInitialData } = useCuraStore();
  const [step, setStep] = useState(1);

  const [caregiverName, setCaregiverName] = useState('Yokeshwaran');
  const [relationship, setRelationship] = useState('Family Member');

  const [chkAuthorized, setChkAuthorized] = useState(false);
  const [chkConsent, setChkConsent] = useState(false);
  const [chkReview, setChkReview] = useState(false);

  const isFormValid = chkAuthorized && chkConsent && chkReview && caregiverName.trim() !== '';

  const handleComplete = async () => {
    try {
      const current = await fetchProfile();
      await updateProfile({
        ...current,
        consent_recorded: true,
        caregiver_name: caregiverName,
        caregiver_relationship: relationship
      });
      await loadInitialData();
      navigate('/');
    } catch (err) {
      console.error('Failed to save consent:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-[#E07856]/20 overflow-hidden">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#E07856] to-[#D06745] p-8 text-white text-center relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4 backdrop-blur-md">
            <Heart className="w-9 h-9 text-white fill-white/30" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome to CURA</h1>
          <p className="text-white/90 text-lg">Stage-Adaptive Voice Companion for Memory Support</p>
          
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-6">
            <span className={`h-2.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-white' : 'w-2.5 bg-white/40'}`} />
            <span className={`h-2.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-white' : 'w-2.5 bg-white/40'}`} />
          </div>
        </div>

        {/* Step 1: Welcome & Boundary Disclaimer */}
        {step === 1 && (
          <div className="p-8 space-y-6">
            <div className="space-y-4 text-[#2B2622]">
              <h2 className="text-2xl font-bold">A Gentle Companion for Varsha</h2>
              <p className="text-lg leading-relaxed text-[#6B6259]">
                CURA provides comforting presence, gentle memory prompting, and consistent daily reassurance tailored to Varsha's cognitive journey.
              </p>
            </div>

            {/* Medical Boundary Disclaimer Card */}
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 flex gap-4 items-start">
              <ShieldAlert className="w-8 h-8 text-amber-700 shrink-0 mt-1" />
              <div className="space-y-2">
                <h3 className="font-bold text-amber-900 text-lg">Important Care Disclaimer</h3>
                <p className="text-amber-800 text-base leading-relaxed">
                  <strong>CURA is a support companion.</strong> It is not a medical device, does not diagnose, and is not an emergency service. CURA strictly respects identity and safety guardrails at all times.
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="bg-[#E07856] hover:bg-[#D06745] text-white px-8 py-4 rounded-2xl font-bold text-lg inline-flex items-center gap-3 transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
              >
                <span>Continue to Authorization</span>
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Consent Form */}
        {step === 2 && (
          <div className="p-8 space-y-6">
            <h2 className="text-2xl font-bold text-[#2B2622]">Caregiver Consent & Authorization</h2>
            <p className="text-[#6B6259]">Please verify your relationship and check all required authorization boxes below.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#6B6259] mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={caregiverName}
                  onChange={(e) => setCaregiverName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-lg focus:outline-none focus:ring-2 focus:ring-[#E07856]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#6B6259] mb-1">Relationship to Varsha</label>
                <input
                  type="text"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-lg focus:outline-none focus:ring-2 focus:ring-[#E07856]"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-4 pt-2">
              <label className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:bg-amber-50/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={chkAuthorized}
                  onChange={(e) => setChkAuthorized(e.target.checked)}
                  className="w-6 h-6 mt-1 accent-[#E07856] rounded"
                />
                <span className="text-base text-[#2B2622]">
                  I am authorized to manage care for <strong>Varsha</strong>.
                </span>
              </label>

              <label className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:bg-amber-50/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={chkConsent}
                  onChange={(e) => setChkConsent(e.target.checked)}
                  className="w-6 h-6 mt-1 accent-[#E07856] rounded"
                />
                <span className="text-base text-[#2B2622]">
                  I consent to storing personal memories to personalize CURA's comforting context.
                </span>
              </label>

              <label className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:bg-amber-50/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={chkReview}
                  onChange={(e) => setChkReview(e.target.checked)}
                  className="w-6 h-6 mt-1 accent-[#E07856] rounded"
                />
                <span className="text-base text-[#2B2622]">
                  I understand I can review, verify, or delete any memory at any time in the Caregiver Dashboard.
                </span>
              </label>
            </div>

            {/* Buttons */}
            <div className="pt-4 flex justify-between items-center">
              <button
                onClick={() => setStep(1)}
                className="text-[#6B6259] hover:text-[#2B2622] font-semibold px-4 py-2"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={!isFormValid}
                className={`px-8 py-4 rounded-2xl font-bold text-lg inline-flex items-center gap-3 transition-all ${
                  isFormValid
                    ? 'bg-[#E07856] hover:bg-[#D06745] text-white shadow-md hover:shadow-lg cursor-pointer active:scale-95'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-6 h-6" />
                <span>Begin CURA Companion</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
