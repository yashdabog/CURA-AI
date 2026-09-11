class VoiceService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis || null;
    this.isListening = false;
    this.isSpeaking = false;
    
    // Check SpeechRecognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    }
  }

  startListening(onResult, onError, onEnd) {
    if (!this.recognition) {
      if (onError) onError('Speech recognition is not supported in this browser. Please use text input.');
      return;
    }

    this.isListening = true;

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (onResult) {
        onResult({
          text: finalTranscript || interimTranscript,
          isFinal: Boolean(finalTranscript)
        });
      }
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      if (onError) onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (onEnd) onEnd();
    };

    try {
      this.recognition.start();
    } catch (err) {
      this.isListening = false;
      if (onError) onError(err);
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  speak(text, speed = 1.0, onStart, onEnd) {
    if (!this.synthesis) {
      if (onEnd) onEnd();
      return;
    }

    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speed || 1.0;
    utterance.pitch = 1.0;

    // Try finding a warm natural female voice if available
    const voices = this.synthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Zira') || v.lang.startsWith('en'));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    this.synthesis.speak(utterance);
  }

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.isSpeaking = false;
    }
  }
}

export const voiceService = new VoiceService();
