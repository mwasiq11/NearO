import { useCallback, useRef } from 'react';

/**
 * Generates sounds using Web Audio API — no external sound files needed.
 * Provides message-sent, ringtone, ringback, and call-end sounds.
 */
export const useSounds = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringtoneIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getCtx = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio not available
    }
  }, []);

  // WhatsApp-like message sent sound — quick dual-tone pop
  const playMessageSent = useCallback(() => {
    playTone(1200, 0.08, 'sine', 0.15);
    setTimeout(() => playTone(1600, 0.08, 'sine', 0.15), 60);
  }, [playTone]);

  // WhatsApp-like message received sound — lower pop
  const playMessageReceived = useCallback(() => {
    playTone(800, 0.1, 'sine', 0.12);
    setTimeout(() => playTone(1000, 0.1, 'sine', 0.12), 80);
  }, [playTone]);

  // Play a single ring burst (used by ringtone and ringback)
  const playRingBurst = useCallback((high = true) => {
    const baseFreq = high ? 440 : 400;
    playTone(baseFreq, 0.15, 'sine', 0.25);
    setTimeout(() => playTone(baseFreq * 1.2, 0.15, 'sine', 0.25), 200);
    setTimeout(() => playTone(baseFreq, 0.15, 'sine', 0.25), 400);
    setTimeout(() => playTone(baseFreq * 1.2, 0.15, 'sine', 0.25), 600);
  }, [playTone]);

  // Start looping ringtone (for incoming calls)
  const startRingtone = useCallback(() => {
    stopRingtone();
    playRingBurst(true);
    ringtoneIntervalRef.current = setInterval(() => playRingBurst(true), 2000);
  }, [playRingBurst]);

  // Stop ringtone
  const stopRingtone = useCallback(() => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
  }, []);

  // Start ringback tone (for outgoing calls — what caller hears)
  const startRingback = useCallback(() => {
    stopRingback();
    playRingBurst(false);
    ringbackIntervalRef.current = setInterval(() => playRingBurst(false), 3000);
  }, [playRingBurst]);

  // Stop ringback
  const stopRingback = useCallback(() => {
    if (ringbackIntervalRef.current) {
      clearInterval(ringbackIntervalRef.current);
      ringbackIntervalRef.current = null;
    }
  }, []);

  // Call ended beep
  const playCallEnd = useCallback(() => {
    playTone(480, 0.3, 'sine', 0.2);
    setTimeout(() => playTone(380, 0.4, 'sine', 0.2), 300);
  }, [playTone]);

  // Stop all sounds
  const stopAll = useCallback(() => {
    stopRingtone();
    stopRingback();
  }, [stopRingtone, stopRingback]);

  return {
    playMessageSent,
    playMessageReceived,
    startRingtone,
    stopRingtone,
    startRingback,
    stopRingback,
    playCallEnd,
    stopAll,
  };
};
