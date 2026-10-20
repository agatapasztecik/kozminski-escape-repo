/**
 * ==========================================================================
 * KOZMINSKI ESCAPE: POLOWANIE NA ECTS — MODUŁ AUDIO (js/audio.js)
 * Akademia Leona Koźmińskiego (ALK) w Warszawie
 * 
 * 8-bitowy syntezator dźwięków retro oparty w 100% na Web Audio API.
 * Brak zewnętrznych plików dźwiękowych (.mp3 / .wav).
 * ==========================================================================
 */

const SoundSystem = (function () {
  'use strict';

  let ctx = null;
  let isMuted = false;

  /**
   * Inicjalizacja oraz wznowienie kontekstu audio (wymagane przez polityki przeglądarek)
   */
  function init() {
    if (!ctx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        ctx = new AudioCtxClass();
      }
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch((err) => console.warn('AudioContext resume error:', err));
    }
    return ctx;
  }

  /**
   * Pomocnik tworzenia pojedynczego węzła dźwiękowego
   */
  function createVoice(type = 'sine') {
    const audioCtx = init();
    if (!audioCtx) return null;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    return { ctx: audioCtx, osc, gain };
  }

  // --- IMPLEMENTACJA EFEKTÓW DŹWIĘKOWYCH RETRO 8-BIT ---

  /**
   * 1. 'ects': Melodyjny dwuton monety retro (fala trójkątna: B5 -> E6)
   */
  function playECTS() {
    const audioCtx = init();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    // Ton 1: B5 (987.77 Hz)
    const voice1 = createVoice('triangle');
    if (!voice1) return;
    voice1.osc.frequency.setValueAtTime(987.77, now);
    voice1.gain.gain.setValueAtTime(0.2, now);
    voice1.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    voice1.osc.start(now);
    voice1.osc.stop(now + 0.08);

    // Ton 2: E6 (1318.51 Hz) - wyższy, klasyczny coin-up
    const voice2 = createVoice('triangle');
    if (!voice2) return;
    voice2.osc.frequency.setValueAtTime(1318.51, now + 0.08);
    voice2.gain.gain.setValueAtTime(0.22, now + 0.08);
    voice2.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    voice2.osc.start(now + 0.08);
    voice2.osc.stop(now + 0.28);
  }

  /**
   * 2. 'coffee': Dźwięk przyspieszenia (rosnąca częstotliwość fali piłokształtnej)
   */
  function playCoffee() {
    const voice = createVoice('sawtooth');
    if (!voice) return;
    const now = voice.ctx.currentTime;
    const duration = 0.26;

    // Płynny wzrost częstotliwości z 220 Hz do 960 Hz
    voice.osc.frequency.setValueAtTime(220, now);
    voice.osc.frequency.exponentialRampToValueAtTime(960, now + duration);

    // Obwiednia głośności
    voice.gain.gain.setValueAtTime(0.18, now);
    voice.gain.gain.linearRampToValueAtTime(0.22, now + duration * 0.7);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    voice.osc.start(now);
    voice.osc.stop(now + duration);
  }

  /**
   * 3. 'shield': Aktywacja legitymacji studenckiej (akord sinusoidalny C-dur)
   */
  function playShield() {
    const audioCtx = init();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const duration = 0.45;

    // Trzy współbrzmiące oscylatory tworzące krystaliczny akord sinusoidalny: C5, E5, G5
    const chordFrequencies = [523.25, 659.25, 783.99];

    chordFrequencies.forEach((freq) => {
      const voice = createVoice('sine');
      if (!voice) return;

      voice.osc.frequency.setValueAtTime(freq, now);
      voice.gain.gain.setValueAtTime(0.1, now);
      voice.gain.gain.linearRampToValueAtTime(0.14, now + 0.06);
      voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      voice.osc.start(now);
      voice.osc.stop(now + duration);
    });
  }

  /**
   * 4. 'freeze': Cyber-freeze AI po zadanym pytaniu (fala prostokątna / square glitch)
   */
  function playFreeze() {
    const voice = createVoice('square');
    if (!voice) return;
    const now = voice.ctx.currentTime;

    // Szybkie, cyfrowe skoki częstotliwości imitujące zawieszenie/freeze AI
    const notes = [1200, 800, 1600, 600, 1400, 400];
    const step = 0.04;

    notes.forEach((freq, idx) => {
      voice.osc.frequency.setValueAtTime(freq, now + idx * step);
    });

    voice.gain.gain.setValueAtTime(0.12, now);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + notes.length * step);

    voice.osc.start(now);
    voice.osc.stop(now + notes.length * step);
  }

  /**
   * 5. 'hit': Złapanie przez egzaminatora (dramatycznie opadający bas)
   */
  function playHit() {
    const voice = createVoice('sawtooth');
    if (!voice) return;
    const now = voice.ctx.currentTime;
    const duration = 0.48;

    // Gwałtowny spadek tonu z 280 Hz do głębokiego basu 42 Hz
    voice.osc.frequency.setValueAtTime(280, now);
    voice.osc.frequency.exponentialRampToValueAtTime(42, now + duration);

    voice.gain.gain.setValueAtTime(0.3, now);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    voice.osc.start(now);
    voice.osc.stop(now + duration);
  }

  /**
   * 6. 'win': Krótka, 4-tonowa fanfara sukcesu (C5 -> E5 -> G5 -> C6)
   */
  function playWin() {
    const audioCtx = init();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    // Nuty fanfary: C5, E5, G5, C6
    const fanfare = [
      { freq: 523.25, time: 0.00, dur: 0.12, type: 'triangle' }, // C5
      { freq: 659.25, time: 0.12, dur: 0.12, type: 'triangle' }, // E5
      { freq: 783.99, time: 0.24, dur: 0.14, type: 'triangle' }, // G5
      { freq: 1046.50, time: 0.38, dur: 0.55, type: 'sine' }     // C6 (finałowe wybrzmienie)
    ];

    fanfare.forEach((n) => {
      const voice = createVoice(n.type);
      if (!voice) return;
      const start = now + n.time;

      voice.osc.frequency.setValueAtTime(n.freq, start);
      voice.gain.gain.setValueAtTime(0.22, start);
      voice.gain.gain.exponentialRampToValueAtTime(0.0001, start + n.dur);

      voice.osc.start(start);
      voice.osc.stop(start + n.dur);
    });
  }

  /**
   * Główny dyspozytor efektów dźwiękowych
   */
  function play(type) {
    if (isMuted) return;

    switch (type) {
      case 'ects':
        playECTS();
        break;
      case 'coffee':
        playCoffee();
        break;
      case 'shield':
        playShield();
        break;
      case 'freeze':
        playFreeze();
        break;
      case 'hit':
        playHit();
        break;
      case 'win':
        playWin();
        break;
      default:
        console.warn(`Nieznany typ dźwięku w SoundSystem: ${type}`);
        break;
    }
  }

  /**
   * Przełącznik wyciszenia (Mute / Unmute)
   */
  function toggleMute() {
    isMuted = !isMuted;
    const audioIcon = document.getElementById('audio-icon');
    if (audioIcon) {
      audioIcon.textContent = isMuted ? '🔇' : '🔊';
    }
    return isMuted;
  }

  return {
    init,
    play,
    toggleMute,
    isMuted: () => isMuted,
    // Aliasy dla zachowania pełnej kompatybilności wstecznej
    playCollect: () => play('ects'),
    playCoffee: () => play('coffee'),
    playPowerup: () => play('shield'),
    playAlert: () => play('freeze'),
    playGameOver: () => play('hit'),
    playVictory: () => play('win')
  };
})();

// Eksport globalny do obiektu window
if (typeof window !== 'undefined') {
  window.SoundSystem = SoundSystem;
  window.GameAudio = SoundSystem; // Kompatybilność z pozostałymi modułami
}
