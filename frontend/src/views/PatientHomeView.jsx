import React, { useState, useEffect } from 'react';
import {
  Mic, MicOff, Bell, HelpCircle, Send, CheckCircle2, Clock, Volume2, VolumeX,
  ShieldAlert, Sparkles, RotateCcw, Heart, Sun, UserCheck, Compass, Flower2, Cake, School, Home
} from 'lucide-react';
import { useCuraStore } from '../store/useCuraStore';
import { voiceService } from '../services/voiceService';

export default function PatientHomeView() {
  const {
    profile,
    isListening,
    isSpeaking,
    transcript,
    messages,
    alerts,
    routines,
    activeReminder,
    distressState,
    startVoiceInput,
    stopVoiceInput,
    handleUserMessage,
    handleRoutineComplete,
    handleRoutineSnooze,
    triggerDemoReminder
  } = useCuraStore();

  const [textInput, setTextInput] = useState('');
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedSpeed, setSelectedSpeed] = useState(profile?.voice_speed || 1.0);
  const [activeTopic, setActiveTopic] = useState(null);

  // Live Clock & Time Greeting
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const options = { weekday: 'long', month: 'long', day: 'numeric' };
  const dateStr = now.toLocaleDateString('en-US', options);

  const hour = now.getHours();
  let timeGreeting = "Good morning";
  if (hour >= 12 && hour < 17) timeGreeting = "Good afternoon";
  else if (hour >= 17) timeGreeting = "Good evening";

  const preferredName = profile?.preferred_name || "Varsha";
  const isSimpleMode = profile?.simple_mode || false;

  const latestReply = messages.find((m) => m.speaker === 'cura');
  const previousReplies = messages.filter((m) => m.speaker === 'cura').slice(1, 4);

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    handleUserMessage(textInput);
    setTextInput('');
  };

  const handleReplayLastSpeech = () => {
    if (latestReply && latestReply.text) {
      voiceService.speak(latestReply.text, selectedSpeed);
    }
  };

  const handleQuickPillClick = (promptText, topicName) => {
    setActiveTopic(topicName);
    handleUserMessage(promptText);
    setTimeout(() => setActiveTopic(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#2B2622] flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden select-none">

      {/* Top Bar: Interactive Greeting, Clock & Audio Control Quick Pill */}
      <header className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-sm border border-[#E07856]/15 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#E07856] to-amber-500 text-white flex items-center justify-center font-extrabold text-2xl shadow-md">
            {preferredName.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2B2622] flex items-center gap-2">
              <span>{timeGreeting}, {preferredName}</span>
              <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
            </h1>
            <p className="text-lg text-[#6B6259] font-medium">{dateStr}</p>
          </div>
        </div>

        {/* Live Ticking Clock & Speed Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#FAF6EF] px-4 py-2.5 rounded-2xl border border-gray-200 shadow-inner">
            <Clock className="w-6 h-6 text-[#E07856] animate-pulse" />
            <span className="text-xl sm:text-2xl font-bold tracking-wide">
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          {!isSimpleMode && (
            <button
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? "Unmute Voice" : "Mute Voice"}
              className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                isMuted ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-white text-[#6B6259] border-gray-200 hover:bg-gray-50'
              }`}
            >
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
          )}
        </div>
      </header>

      {/* Interactive Quick Feeling & Reassurance Bar (Hidden in Simple Mode) */}
      {!isSimpleMode && (
        <div className="w-full max-w-4xl mx-auto my-3 overflow-x-auto pb-1">
          <div className="flex items-center gap-2 min-w-max">
            <span className="text-xs font-bold text-[#6B6259] uppercase tracking-wider mr-1">Quick Prompts:</span>
            
            <button
              onClick={() => handleQuickPillClick("When is Yokeshwaran calling?", "Yokeshwaran")}
              className={`px-4 py-2 rounded-2xl border text-sm font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                activeTopic === 'Yokeshwaran'
                  ? 'bg-[#E07856] text-white border-[#E07856] shadow-md'
                  : 'bg-white text-[#2B2622] border-gray-200 hover:border-[#E07856]/40 hover:bg-amber-50/50'
              }`}
            >
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>Yokeshwaran Call</span>
            </button>

            <button
              onClick={() => handleQuickPillClick("Tell me about my prize roses", "Roses")}
              className={`px-4 py-2 rounded-2xl border text-sm font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                activeTopic === 'Roses'
                  ? 'bg-[#E07856] text-white border-[#E07856] shadow-md'
                  : 'bg-white text-[#2B2622] border-gray-200 hover:border-[#E07856]/40 hover:bg-amber-50/50'
              }`}
            >
              <Flower2 className="w-4 h-4 text-emerald-600" />
              <span>Prize Roses</span>
            </button>

            <button
              onClick={() => handleQuickPillClick("Where am I?", "Disorientation")}
              className={`px-4 py-2 rounded-2xl border text-sm font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                activeTopic === 'Disorientation'
                  ? 'bg-[#E07856] text-white border-[#E07856] shadow-md'
                  : 'bg-white text-[#2B2622] border-gray-200 hover:border-[#E07856]/40 hover:bg-amber-50/50'
              }`}
            >
              <Compass className="w-4 h-4 text-amber-600" />
              <span>Where am I?</span>
            </button>

            <button
              onClick={() => handleQuickPillClick("Tell me about my famous lemon cake", "Cake")}
              className={`px-4 py-2 rounded-2xl border text-sm font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                activeTopic === 'Cake'
                  ? 'bg-[#E07856] text-white border-[#E07856] shadow-md'
                  : 'bg-white text-[#2B2622] border-gray-200 hover:border-[#E07856]/40 hover:bg-amber-50/50'
              }`}
            >
              <Cake className="w-4 h-4 text-amber-500" />
              <span>Lemon Cake</span>
            </button>

            <button
              onClick={() => handleQuickPillClick("Tell me about Riverside School", "School")}
              className={`px-4 py-2 rounded-2xl border text-sm font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                activeTopic === 'School'
                  ? 'bg-[#E07856] text-white border-[#E07856] shadow-md'
                  : 'bg-white text-[#2B2622] border-gray-200 hover:border-[#E07856]/40 hover:bg-amber-50/50'
              }`}
            >
              <School className="w-4 h-4 text-indigo-500" />
              <span>Teaching Career</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Core Interaction Center */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full space-y-6 my-2">
        
        {/* Interactive Circular Mic Button with Ripple Effects */}
        <div className="relative flex items-center justify-center py-4">
          {/* Animated background ripple circles */}
          {(isListening || isSpeaking) && (
            <>
              <div className="absolute w-60 h-60 sm:w-72 sm:h-72 rounded-full bg-[#E07856]/20 animate-ripple-1 pointer-events-none" />
              <div className="absolute w-60 h-60 sm:w-72 sm:h-72 rounded-full bg-[#E07856]/15 animate-ripple-2 pointer-events-none" />
            </>
          )}

          <button
            onClick={() => (isListening ? stopVoiceInput() : startVoiceInput())}
            disabled={isSpeaking}
            aria-label={isListening ? "Stop listening" : "Start speaking to CURA"}
            className={`w-44 h-44 sm:w-52 sm:h-52 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 transform active:scale-95 cursor-pointer relative z-10 ${
              isSpeaking
                ? 'bg-gradient-to-tr from-amber-500 to-amber-600 text-white cursor-not-allowed shadow-amber-500/30'
                : isListening
                ? 'bg-gradient-to-tr from-[#E07856] to-[#D06745] text-white animate-pulse-mic ring-8 ring-[#E07856]/30 shadow-[#E07856]/40'
                : 'bg-gradient-to-tr from-[#E07856] to-[#D06745] hover:from-[#D06745] hover:to-[#C05634] text-white hover:scale-105 shadow-[#E07856]/30'
            }`}
          >
            {isSpeaking ? (
              <Volume2 className="w-20 h-20 animate-bounce" />
            ) : isListening ? (
              <Mic className="w-20 h-20 animate-pulse" />
            ) : (
              <Mic className="w-20 h-20" />
            )}
            <span className="mt-2 text-xl font-extrabold tracking-wide">
              {isSpeaking ? 'CURA Speaking...' : isListening ? 'Listening...' : 'Tap to Speak'}
            </span>
          </button>
        </div>

        {/* Live Audio Waveform while TTS speaking */}
        {isSpeaking && (
          <div className="flex items-center justify-center gap-2 h-14 bg-white/80 px-6 py-2 rounded-2xl border border-amber-300 shadow-sm">
            <span className="text-xs font-bold text-amber-800 uppercase mr-2">Speaking</span>
            <div className="w-2.5 bg-[#E07856] rounded-full wave-bar-1" />
            <div className="w-2.5 bg-[#E07856] rounded-full wave-bar-2" />
            <div className="w-2.5 bg-[#E07856] rounded-full wave-bar-3" />
            <div className="w-2.5 bg-[#E07856] rounded-full wave-bar-4" />
            <div className="w-2.5 bg-[#E07856] rounded-full wave-bar-5" />
          </div>
        )}

        {/* Live Speech Transcript Line */}
        {isListening && (
          <div className="w-full text-center bg-white/95 p-4 rounded-2xl border border-[#E07856]/40 shadow-sm animate-scale-in">
            <p className="text-2xl font-bold text-[#E07856] italic">"{transcript || 'Listening to your voice...'}"</p>
          </div>
        )}

        {/* CURA's Speech Bubble Card (Large, Clear, Replayable) */}
        {latestReply && (
          <div className="w-full space-y-3 animate-scale-in">
            {/* Primary Latest Reply Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border-2 border-[#E07856]/30 relative overflow-hidden group">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full bg-[#E07856] animate-pulse" />
                  <span className="font-extrabold text-[#6B6259] text-lg uppercase tracking-wider">CURA</span>
                </div>

                {/* Replay Speech Button */}
                <button
                  onClick={handleReplayLastSpeech}
                  title="Listen again"
                  className="flex items-center gap-2 text-sm font-bold text-[#E07856] bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Replay</span>
                </button>
              </div>

              <p className="text-2xl sm:text-3xl font-extrabold leading-snug text-[#2B2622]">
                {latestReply.text}
              </p>
            </div>

            {/* Previous Replies Interactive Stack (Click to replay) */}
            {!isSimpleMode && previousReplies.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-[#6B6259] uppercase tracking-wider px-1">Recent Replies:</span>
                {previousReplies.map((prev) => (
                  <div
                    key={prev.id}
                    onClick={() => voiceService.speak(prev.text, selectedSpeed)}
                    title="Click to listen"
                    className="bg-white/70 hover:bg-white p-4 rounded-2xl border border-gray-200 shadow-sm cursor-pointer transition-all hover:border-[#E07856]/30 flex justify-between items-center group"
                  >
                    <p className="text-lg font-medium text-[#6B6259] group-hover:text-[#2B2622]">{prev.text}</p>
                    <Volume2 className="w-5 h-5 text-gray-400 group-hover:text-[#E07856] shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Large Text Input Fallback (Always available) */}
        {!isSimpleMode && (
          <form onSubmit={handleTextSubmit} className="w-full flex items-center gap-3">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your message to CURA..."
              className="flex-1 px-6 py-4 sm:py-5 rounded-2xl bg-white border-2 border-gray-200 text-xl sm:text-2xl font-medium focus:outline-none focus:border-[#E07856] shadow-inner"
            />
            <button
              type="submit"
              className="bg-[#E07856] hover:bg-[#D06745] text-white p-4 sm:p-5 rounded-2xl shadow-md active:scale-95 cursor-pointer transition-all"
            >
              <Send className="w-7 h-7 sm:w-8 sm:h-8" />
            </button>
          </form>
        )}
      </main>

      {/* Bottom Bar: Reminders & Help (Hidden in simple mode) */}
      {!isSimpleMode && (
        <footer className="w-full max-w-4xl mx-auto flex justify-around items-center bg-white/90 backdrop-blur-md rounded-3xl p-4 shadow-lg border border-[#E07856]/15 mt-2">
          <button
            onClick={() => setShowRemindersModal(true)}
            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-[#FAF6EF] hover:bg-amber-100 text-[#2B2622] font-extrabold text-lg sm:text-xl transition-all cursor-pointer active:scale-95"
          >
            <Bell className="w-7 h-7 text-[#E07856]" />
            <span>Reminders ({routines.filter(r => r.active).length})</span>
          </button>

          <button
            onClick={() => handleUserMessage("I need some help please")}
            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-lg sm:text-xl transition-all shadow-md cursor-pointer active:scale-95"
          >
            <HelpCircle className="w-7 h-7" />
            <span>Help</span>
          </button>
        </footer>
      )}

      {/* Reminders Modal overlay */}
      {showRemindersModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-scale-in">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <h2 className="text-3xl font-bold text-[#2B2622]">Daily Reminders</h2>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {routines.map((rt) => (
                <div key={rt.id} className="p-4 rounded-2xl border border-gray-200 flex justify-between items-center bg-[#FAF6EF] hover:bg-white transition-colors">
                  <div>
                    <h3 className="text-xl font-bold text-[#2B2622]">{rt.title}</h3>
                    <p className="text-lg text-[#6B6259]">{rt.time} • {rt.type}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowRemindersModal(false);
                      triggerDemoReminder(rt);
                    }}
                    className="bg-[#E07856] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#D06745] cursor-pointer"
                  >
                    Test Reminder
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowRemindersModal(false)}
              className="w-full py-4 bg-gray-200 hover:bg-gray-300 text-[#2B2622] rounded-2xl font-bold text-xl cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* FULL SCREEN REMINDER OVERLAY */}
      {activeReminder && (
        <div className="fixed inset-0 bg-amber-500/95 backdrop-blur-md flex flex-col items-center justify-center p-8 z-50 text-white text-center space-y-8 animate-scale-in">
          <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
            <Bell className="w-16 h-16 text-white animate-bounce" />
          </div>
          <div className="space-y-4 max-w-xl">
            <h2 className="text-4xl sm:text-5xl font-extrabold">Time for your {activeReminder.title}, {preferredName}</h2>
            <p className="text-2xl text-white/90 font-medium">Scheduled for {activeReminder.time}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 w-full max-w-xl">
            <button
              onClick={() => handleRoutineComplete(activeReminder.id)}
              className="flex-1 bg-white text-emerald-800 hover:bg-emerald-50 py-6 rounded-3xl font-extrabold text-3xl shadow-xl flex items-center justify-center gap-3 cursor-pointer active:scale-95 transition-transform"
            >
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              <span>Done</span>
            </button>

            <button
              onClick={() => handleRoutineSnooze(activeReminder.id)}
              className="flex-1 bg-amber-700/80 hover:bg-amber-800 text-white py-6 rounded-3xl font-extrabold text-3xl shadow-xl flex items-center justify-center gap-3 cursor-pointer active:scale-95 transition-transform"
            >
              <Clock className="w-10 h-10 text-white" />
              <span>Snooze {activeReminder.snooze_minutes}m</span>
            </button>
          </div>
        </div>
      )}

      {/* DISTRESS DE-ESCALATION OVERLAY */}
      {distressState && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-8 z-50 text-white text-center space-y-8 animate-scale-in">
          <div className="w-24 h-24 rounded-full bg-amber-500/30 flex items-center justify-center border-2 border-amber-400">
            <ShieldAlert className="w-16 h-16 text-amber-400" />
          </div>

          <div className="space-y-4 max-w-xl">
            <h2 className="text-4xl font-bold">You are safe, {preferredName}</h2>
            <p className="text-2xl text-slate-300">CURA is right here with you.</p>
            <p className="text-xl text-amber-300 font-semibold pt-4">
              Yokeshwaran has been notified and help is available.
            </p>
          </div>

          <button
            onClick={() => useCuraStore.setState({ distressState: null })}
            className="bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-2xl text-xl font-bold cursor-pointer transition-all"
          >
            I feel safe now
          </button>
        </div>
      )}

    </div>
  );
}
