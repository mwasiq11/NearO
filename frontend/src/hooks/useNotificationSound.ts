import { useCallback, useRef } from 'react';
import { useAppSelector } from '../store/hooks';
import { api } from '@/lib/api';

export const useNotificationSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playNotificationSound = useCallback(async () => {
    try {
      // Fetch fresh preferences from DB to ensure sound is still enabled
      const userPrefs = await api.get<any>('/users/me/preferences', { auth: true });
      
      if (userPrefs && userPrefs.sound_enabled === false) {
        return;
      }

      if (!audioRef.current) {
        // Using a premium, subtle notification chime
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        audioRef.current.volume = 0.5;
      }

      // Reset to start if already playing
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }, []);

  return { playNotificationSound };
};
