import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Phone, Video, X, Mic, MicOff, VideoOff, PhoneOff, Maximize2, Minimize2 } from 'lucide-react';
import { CallState, CallStatus, CallType } from '@/hooks/useCall';
import { motion, AnimatePresence } from 'framer-motion';

interface CallOverlayProps {
  callState: CallState;
  onAccept: () => void;
  onDecline: () => void;
  onEnd: () => void;
}

export const CallOverlay: React.FC<CallOverlayProps> = ({
  callState,
  onAccept,
  onDecline,
  onEnd,
}) => {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (callState.status === 'active' && callState.startTime) {
      interval = setInterval(() => {
        setDuration(Math.floor((Date.now() - callState.startTime!) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState.status, callState.startTime]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (callState.status === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 pointer-events-none`}
      >
        <div className={`w-full max-w-4xl bg-zinc-900 rounded-[32px] overflow-hidden shadow-2xl border border-white/10 pointer-events-auto flex flex-col relative ${isFullScreen ? 'h-full' : 'aspect-video max-h-[80vh]'}`}>
          
          {/* Jitsi Iframe Area (Active Call) */}
          {callState.status === 'active' && (
            <div className="absolute inset-0 bg-black">
              <iframe
                allow="camera; microphone; display-capture; fullscreen; clipboard-read; clipboard-write; autoplay"
                src={`https://meet.jit.si/${callState.roomName}#config.prejoinPageEnabled=false&config.disableDeepLinking=true&interfaceConfig.TOOLBAR_BUTTONS=["microphone","camera","closedcaptions","desktop","embedly","fullscreen","fodeviceselection","hangup","profile","chat","recording","livestreaming","etherpad","sharedvideo","settings","raisehand","videoquality","filmstrip","invite","feedback","stats","shortcuts","tileview","videobackgroundblur","download","help","mute-everyone","security"]`}
                className="w-full h-full border-none"
                title="Jitsi Meeting"
              />
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white font-medium text-sm">{formatDuration(duration)}</span>
              </div>
              <Button 
                variant="destructive" 
                size="icon" 
                className="absolute bottom-6 left-1/2 -translate-x-1/2 h-16 w-16 rounded-full shadow-2xl hover:scale-110 transition-transform"
                onClick={onEnd}
              >
                <PhoneOff className="h-8 w-8" />
              </Button>
            </div>
          )}

          {/* Outgoing/Incoming UI */}
          {(callState.status === 'outgoing' || callState.status === 'incoming' || callState.status === 'ended') && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gradient-to-b from-zinc-800 to-zinc-950">
              <motion.div
                animate={callState.status === 'ended' ? {} : { scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="relative mb-8"
              >
                <Avatar className="h-32 w-32 border-4 border-primary/30 ring-4 ring-black/20">
                  <AvatarImage src={callState.otherUserPicture} />
                  <AvatarFallback className="bg-primary/20 text-primary text-4xl font-bold">
                    {callState.otherUserName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {callState.status !== 'ended' && (
                  <div className="absolute -bottom-2 -right-2 bg-primary rounded-full p-2 shadow-lg">
                    {callState.callType === 'video' ? <Video className="h-5 w-5 text-white" /> : <Phone className="h-5 w-5 text-white" />}
                  </div>
                )}
              </motion.div>

              <h3 className="text-3xl font-bold text-white mb-2">{callState.otherUserName}</h3>
              <p className="text-zinc-400 text-lg mb-12">
                {callState.status === 'outgoing' && 'Calling...'}
                {callState.status === 'incoming' && `Incoming ${callState.callType} call`}
                {callState.status === 'ended' && 'Call Ended'}
              </p>

              <div className="flex items-center gap-8">
                {callState.status === 'incoming' ? (
                  <>
                    <Button 
                      onClick={onDecline}
                      variant="destructive" 
                      size="icon" 
                      className="h-20 w-20 rounded-full shadow-xl hover:scale-110 transition-transform"
                    >
                      <PhoneOff className="h-10 w-10" />
                    </Button>
                    <Button 
                      onClick={onAccept}
                      className="h-20 w-20 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-xl hover:scale-110 transition-transform"
                    >
                      {callState.callType === 'video' ? <Video className="h-10 w-10 text-white" /> : <Phone className="h-10 w-10 text-white" />}
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={onEnd}
                    variant="destructive" 
                    size="icon" 
                    className="h-20 w-20 rounded-full shadow-xl hover:scale-110 transition-transform"
                  >
                    <PhoneOff className="h-10 w-10" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
