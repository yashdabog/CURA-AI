import { create } from 'zustand';
import {
  fetchProfile, updateProfile, sendChatMessage,
  fetchAlerts, fetchRoutines, performRoutineAction
} from '../services/api';
import { voiceService } from '../services/voiceService';

export const useCuraStore = create((set, get) => ({
  profile: null,
  isListening: false,
  isSpeaking: false,
  transcript: '',
  messages: [], // [{ id, speaker, text, emotion_state, timestamp }]
  alerts: [],
  routines: [],
  activeReminder: null,
  distressState: null,
  overrideTime: null, // for testing sundowning / specific time
  conversationId: null,

  loadInitialData: async () => {
    try {
      const prof = await fetchProfile();
      const alertsList = await fetchAlerts(true);
      const routinesList = await fetchRoutines();
      set({ profile: prof, alerts: alertsList, routines: routinesList });
    } catch (err) {
      console.error('Failed to load initial CURA store data:', err);
    }
  },

  setOverrideTime: (timeStr) => set({ overrideTime: timeStr }),

  setStage: async (newStage) => {
    const { profile } = get();
    if (!profile) return;
    try {
      const updated = await updateProfile({ ...profile, stage: newStage });
      set({ profile: updated });
    } catch (err) {
      console.error('Failed to update stage:', err);
    }
  },

  toggleSimpleMode: async () => {
    const { profile } = get();
    if (!profile) return;
    try {
      const updated = await updateProfile({ ...profile, simple_mode: !profile.simple_mode });
      set({ profile: updated });
    } catch (err) {
      console.error('Failed to toggle simple mode:', err);
    }
  },

  handleUserMessage: async (text) => {
    if (!text || !text.trim()) return;

    const userText = text.trim();
    const userMsg = {
      id: `usr_${Date.now()}`,
      speaker: 'patient',
      text: userText,
      timestamp: new Date().toISOString()
    };

    set((state) => ({
      messages: [userMsg, ...state.messages],
      transcript: userText
    }));

    try {
      const { overrideTime, conversationId } = get();
      const res = await sendChatMessage(userText, overrideTime, conversationId);

      const curaMsg = {
        id: `cura_${Date.now()}`,
        speaker: 'cura',
        text: res.reply,
        emotion_state: res.emotion_state,
        timestamp: new Date().toISOString()
      };

      set((state) => ({
        messages: [curaMsg, ...state.messages],
        conversationId: res.conversation_id,
        distressState: ['distressed', 'emergency'].includes(res.emotion_state) ? res.emotion_state : null
      }));

      // Speak CURA's reply using TTS
      voiceService.speak(
        res.reply,
        res.audio_speed || 1.0,
        () => set({ isSpeaking: true }),
        () => set({ isSpeaking: false })
      );

      // Refresh alerts if alert was created
      if (res.alert_created) {
        const freshAlerts = await fetchAlerts(true);
        set({ alerts: freshAlerts });
      }

    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMsg = {
        id: `cura_err_${Date.now()}`,
        speaker: 'cura',
        text: "I am right here with you, Margaret. You are safe.",
        timestamp: new Date().toISOString()
      };
      set((state) => ({ messages: [fallbackMsg, ...state.messages] }));
    }
  },

  startVoiceInput: () => {
    const { isSpeaking } = get();
    if (isSpeaking) {
      voiceService.stopSpeaking();
      set({ isSpeaking: false });
    }

    set({ isListening: true, transcript: 'Listening...' });

    voiceService.startListening(
      (res) => {
        set({ transcript: res.text });
        if (res.isFinal && res.text) {
          set({ isListening: false });
          get().handleUserMessage(res.text);
        }
      },
      (err) => {
        console.warn('Voice recognition error:', err);
        set({ isListening: false, transcript: '' });
      },
      () => {
        set({ isListening: false });
      }
    );
  },

  stopVoiceInput: () => {
    voiceService.stopListening();
    set({ isListening: false });
  },

  handleRoutineComplete: async (routineId) => {
    try {
      await performRoutineAction(routineId, 'done');
      const routinesList = await fetchRoutines();
      set({ activeReminder: null, routines: routinesList });
    } catch (err) {
      console.error('Routine complete error:', err);
    }
  },

  handleRoutineSnooze: async (routineId) => {
    try {
      await performRoutineAction(routineId, 'snooze');
      const routinesList = await fetchRoutines();
      set({ activeReminder: null, routines: routinesList });
    } catch (err) {
      console.error('Routine snooze error:', err);
    }
  },

  handleRoutineMiss: async (routineId) => {
    try {
      await performRoutineAction(routineId, 'miss');
      const routinesList = await fetchRoutines();
      const freshAlerts = await fetchAlerts(true);
      set({ activeReminder: null, routines: routinesList, alerts: freshAlerts });
    } catch (err) {
      console.error('Routine miss error:', err);
    }
  },

  triggerDemoReminder: (routine) => {
    set({ activeReminder: routine });
    voiceService.speak(`Time for your ${routine.title}, Margaret.`);
  }
}));
