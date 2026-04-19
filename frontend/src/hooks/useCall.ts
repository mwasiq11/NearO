import { useCallback, useEffect, useRef, useState } from 'react';
import { getSocket } from '@/lib/socket';
import { useAppSelector } from '@/store/hooks';
import { useSounds } from './useSounds';
import { v4 as uuidv4 } from 'uuid';

export type CallStatus = 'idle' | 'outgoing' | 'incoming' | 'connecting' | 'active' | 'ended';
export type CallType = 'audio' | 'video';

export interface CallState {
  status: CallStatus;
  callType: CallType;
  roomName: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPicture?: string;
  startTime?: number;
}

const initialCallState: CallState = {
  status: 'idle',
  callType: 'audio',
  roomName: '',
  otherUserId: '',
  otherUserName: '',
};

export const useCall = () => {
  const { user } = useAppSelector(state => state.auth);
  const [callState, setCallState] = useState<CallState>(initialCallState);
  const { startRingtone, stopRingtone, startRingback, stopRingback, playCallEnd, stopAll } = useSounds();
  const callTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listen for incoming call events
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();

    const handleIncoming = ({ callerId, callerName, callType, roomName }: any) => {
      // Don't accept if already in a call
      if (callState.status !== 'idle') {
        socket.emit('call:decline', { callerId });
        return;
      }
      setCallState({
        status: 'incoming',
        callType,
        roomName,
        otherUserId: callerId,
        otherUserName: callerName || 'User',
      });
      startRingtone();
    };

    const handleAccepted = ({ roomName }: any) => {
      stopRingback();
      setCallState(prev => ({
        ...prev,
        status: 'active',
        roomName,
        startTime: Date.now(),
      }));
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    };

    const handleDeclined = () => {
      stopRingback();
      playCallEnd();
      setCallState(prev => ({ ...prev, status: 'ended' }));
      setTimeout(() => setCallState(initialCallState), 2000);
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    };

    const handleEnded = () => {
      stopAll();
      playCallEnd();
      setCallState(prev => ({ ...prev, status: 'ended' }));
      setTimeout(() => setCallState(initialCallState), 2000);
    };

    const handleUnavailable = () => {
      stopRingback();
      playCallEnd();
      setCallState(prev => ({ ...prev, status: 'ended' }));
      setTimeout(() => setCallState(initialCallState), 2000);
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    };

    socket.on('call:incoming', handleIncoming);
    socket.on('call:accepted', handleAccepted);
    socket.on('call:declined', handleDeclined);
    socket.on('call:ended', handleEnded);
    socket.on('call:unavailable', handleUnavailable);

    return () => {
      socket.off('call:incoming', handleIncoming);
      socket.off('call:accepted', handleAccepted);
      socket.off('call:declined', handleDeclined);
      socket.off('call:ended', handleEnded);
      socket.off('call:unavailable', handleUnavailable);
    };
  }, [user, callState.status]);

  const initiateCall = useCallback((
    receiverId: string,
    receiverName: string,
    receiverPicture: string | undefined,
    callType: CallType
  ) => {
    if (!user) return;
    const socket = getSocket();
    const roomName = `nearo-call-${uuidv4().slice(0, 8)}`;

    setCallState({
      status: 'outgoing',
      callType,
      roomName,
      otherUserId: receiverId,
      otherUserName: receiverName,
      otherUserPicture: receiverPicture,
    });

    socket.emit('call:initiate', { receiverId, callType, roomName });
    startRingback();

    // Auto-timeout after 45 seconds
    callTimeoutRef.current = setTimeout(() => {
      stopRingback();
      playCallEnd();
      setCallState(prev => ({ ...prev, status: 'ended' }));
      setTimeout(() => setCallState(initialCallState), 2000);
    }, 45000);
  }, [user, startRingback, stopRingback, playCallEnd]);

  const acceptCall = useCallback(() => {
    if (!user || callState.status !== 'incoming') return;
    const socket = getSocket();
    stopRingtone();

    socket.emit('call:accept', {
      callerId: callState.otherUserId,
      roomName: callState.roomName,
    });

    setCallState(prev => ({
      ...prev,
      status: 'active',
      startTime: Date.now(),
    }));
  }, [user, callState, stopRingtone]);

  const declineCall = useCallback(() => {
    if (!user) return;
    const socket = getSocket();
    stopRingtone();

    socket.emit('call:decline', { callerId: callState.otherUserId });
    playCallEnd();
    setCallState(initialCallState);
  }, [user, callState, stopRingtone, playCallEnd]);

  const endCall = useCallback(() => {
    if (!user) return;
    const socket = getSocket();
    stopAll();

    socket.emit('call:end', { otherUserId: callState.otherUserId });
    playCallEnd();
    setCallState(prev => ({ ...prev, status: 'ended' }));
    setTimeout(() => setCallState(initialCallState), 2000);
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
  }, [user, callState, stopAll, playCallEnd]);

  return {
    callState,
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
  };
};
