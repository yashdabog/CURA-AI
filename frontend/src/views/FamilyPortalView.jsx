import React, { useState, useEffect } from 'react';
import { Heart, Send, CheckCircle2, BookOpen, Clock, User, MapPin, Sparkles, Star } from 'lucide-react';
import { submitFamilyMemory, fetchFamilyGuide } from '../services/api';

export default function FamilyPortalView() {
  const [submitterName, setSubmitterName] = useState('');
  const [relationship, setRelationship] = useState('Family Member');
  const [memType, setMemType] = useState('person');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [guideData, setGuideData] = useState({ guide_cards: [], next_scheduled_call: '' });

  useEffect(() => {
    fetchFamilyGuide().then(setGuideData).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submitterName.trim() || !title.trim() || !content.trim()) return;

    try {
      await submitFamilyMemory({
        submitter_name: submitterName,
        relationship: relationship,
        type: memType,
        title: title,
        content: content,
        related_people: [submitterName]
      });
      setSubmittedSuccess(true);
      setTitle('');
      setContent('');
    } catch (err) {
      console.error('Failed submitting memory:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#2B2622] p-6 max-w-4xl mx-auto space-y-8">
      
      {/* Header Banner */}
      <header className="bg-white p-8 rounded-3xl border border-[#E07856]/20 shadow-md text-center space-y-3 relative overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-[#E07856] text-white flex items-center justify-center mx-auto shadow-md">
          <Heart className="w-9 h-9 fill-white/30" />
        </div>
        <h1 className="text-3xl font-extrabold text-[#2B2622]">CURA Family Portal</h1>
        <p className="text-lg text-[#6B6259]">
          Share cherished memories to help CURA connect deeply with Varsha.
        </p>
        {guideData.next_scheduled_call && (
          <div className="inline-flex items-center gap-2 bg-amber-100/80 text-amber-900 px-4 py-2 rounded-2xl text-sm font-bold pt-2">
            <Clock className="w-4 h-4" />
            <span>{guideData.next_scheduled_call}</span>
          </div>
        )}
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Memory Submission Form */}
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Send className="w-6 h-6 text-[#E07856]" />
            <span>Share a Memory</span>
          </h2>

          {submittedSuccess ? (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 text-center space-y-3 animate-scale-in">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
              <h3 className="text-xl font-bold text-emerald-900">Memory Submitted!</h3>
              <p className="text-emerald-800 text-sm">
                Thank you! Your memory has been submitted to Yokeshwaran (Caregiver) for verification before CURA uses it.
              </p>
              <button
                onClick={() => setSubmittedSuccess(false)}
                className="mt-2 text-[#E07856] font-bold text-sm underline cursor-pointer"
              >
                Submit another memory
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#6B6259] mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Yokeshwaran / Viswesh"
                  value={submitterName}
                  onChange={(e) => setSubmitterName(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E07856]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B6259] mb-1">Relationship to Varsha</label>
                <input
                  type="text"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E07856]"
                />
              </div>

              {/* Interactive Memory Type Selectable Badges */}
              <div>
                <label className="block text-xs font-bold text-[#6B6259] mb-2">Select Memory Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'person', label: 'Special Person', icon: User },
                    { id: 'place', label: 'Place / Trip', icon: MapPin },
                    { id: 'event', label: 'Family Event', icon: Star },
                    { id: 'preference', label: 'Hobby / Food', icon: Heart },
                  ].map((cat) => {
                    const CatIcon = cat.icon;
                    const isSel = memType === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setMemType(cat.id)}
                        className={`p-3 rounded-xl border font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                          isSel
                            ? 'bg-[#E07856] text-white border-[#E07856] shadow-sm'
                            : 'bg-[#FAF6EF] border-gray-200 text-[#6B6259] hover:bg-gray-100'
                        }`}
                      >
                        <CatIcon className="w-4 h-4" />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B6259] mb-1">Memory Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer trips to Lake Windermere"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E07856]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B6259] mb-1">Memory Content / Details</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share details about what Varsha enjoyed..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#E07856]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#E07856] hover:bg-[#D06745] text-white font-bold text-lg rounded-2xl shadow-md cursor-pointer transition-all active:scale-95"
              >
                Submit Memory for Caregiver Review
              </button>
            </form>
          )}
        </div>

        {/* Live Interactive Memory Preview & Engagement Guidelines */}
        <div className="space-y-6">
          {/* Live Preview Card */}
          {(title.trim() || content.trim()) && (
            <div className="bg-gradient-to-tr from-amber-500 to-amber-600 text-white p-6 rounded-3xl shadow-lg space-y-2 animate-scale-in">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-100">
                <Sparkles className="w-4 h-4" />
                <span>Live CURA Memory Preview</span>
              </div>
              <h3 className="text-xl font-bold">{title || 'Untitled Memory'}</h3>
              <p className="text-sm leading-relaxed text-amber-50">
                "{content || 'Memory details will appear here...'}"
              </p>
              {submitterName && (
                <p className="text-xs text-amber-200 italic pt-1">
                  Submitted by {submitterName} ({relationship})
                </p>
              )}
            </div>
          )}

          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-[#E07856]" />
              <span>How to Connect Best</span>
            </h2>
            <div className="space-y-4">
              {guideData.guide_cards.map((card, idx) => (
                <div key={idx} className="bg-[#FAF6EF] p-4 rounded-2xl border border-gray-200 space-y-1">
                  <h3 className="font-bold text-[#E07856] text-base">{card.title}</h3>
                  <p className="text-sm text-[#6B6259] leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
