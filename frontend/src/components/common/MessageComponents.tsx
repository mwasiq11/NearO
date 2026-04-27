import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Mic as MicIcon, Paperclip, CheckCheck, Play, Pause, Download, FileText, Phone, Video, MoreVertical, ArrowLeft, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MessageBubbleProps {
  message: {
    id: string;
    content?: string;
    type?: 'text' | 'image' | 'voice' | 'file';
    message_type?: 'text' | 'image' | 'voice' | 'file';
    file_url?: string;
    fileUrl?: string;
    file_name?: string;
    fileName?: string;
    file_size?: number;
    fileSize?: number;
    file_type?: string;
    fileType?: string;
    duration?: number;
    sender_id?: string;
    senderId?: string;
    status?: 'sent' | 'delivered' | 'read';
    isRead?: boolean;
    created_at?: string;
    createdAt?: string;
    service_title?: string;
    serviceTitle?: string;
  };
  isOwn: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => {
  const messageType = message.message_type || message.type || 'text';
  const fileUrl = message.file_url || message.fileUrl;
  const fileName = message.file_name || message.fileName;
  const fileSize = message.file_size || message.fileSize;
  const fileType = message.file_type || message.fileType;
  const createdAt = message.created_at || message.createdAt || new Date().toISOString();
  const status = message.status || (message.isRead ? 'read' : 'sent');
  const serviceTitle = message.service_title || message.serviceTitle;

  // Audio Playback Logic
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveform = useRef(Array.from({ length: 32 }).map(() => Math.max(15, Math.random() * 100)));

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
      };
      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      };
      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
      };
      
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, []);

  const formatSeconds = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getStatusIcon = () => {
    if (!isOwn) return null;
    if (status === 'read') return <CheckCheck className="h-3 w-3 text-sky-500" />;
    return <CheckCheck className="h-3 w-3 text-zinc-400" />;
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  return (
    <div className={`flex w-full mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[75%] px-3 py-1.5 shadow-sm min-w-[80px] ${
          isOwn 
            ? 'bg-[#dcf8c6] dark:bg-[#056162] rounded-lg rounded-tr-none bubble-tail-own text-zinc-900 dark:text-zinc-100' 
            : 'bg-white dark:bg-[#202c33] rounded-lg rounded-tl-none bubble-tail-other text-zinc-900 dark:text-zinc-100'
        }`}
      >
        {/* Actual Content */}
        <div className="flex flex-col">
          {serviceTitle && (
            <div className="mb-1">
              <Badge variant="outline" className="text-[9px] uppercase tracking-tighter py-0 h-4 bg-black/5 border-black/10 dark:bg-white/5 dark:border-white/10 font-bold">
                Re: {serviceTitle}
              </Badge>
            </div>
          )}
          {messageType === 'text' && (
            <p className="text-[14.5px] leading-relaxed break-words">{message.content}</p>
          )}

          {messageType === 'image' && (
            <div className="rounded-md overflow-hidden mb-1">
              <img src={fileUrl} className="max-w-full max-h-[300px] object-cover cursor-pointer" onClick={() => window.open(fileUrl)} />
              {message.content && <p className="mt-1 text-sm">{message.content}</p>}
            </div>
          )}

          {messageType === 'voice' && (
            <div className={`flex items-center gap-3 py-1 min-w-[220px] ${!isOwn && 'px-1'}`}>
              <audio ref={audioRef} src={fileUrl} preload="metadata" />
              {!isOwn && message.sender_id && (
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${message.sender_id}`} />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              )}
              <Button 
                onClick={togglePlay}
                size="icon" 
                variant="ghost" 
                className="h-11 w-11 rounded-full flex-shrink-0 hover:bg-black/5 dark:hover:bg-white/5 bg-black/5 dark:bg-white/5"
              >
                {isPlaying ? <Pause className="h-5 w-5 text-zinc-700 dark:text-zinc-200" /> : <Play className="h-5 w-5 ml-1 text-zinc-700 dark:text-zinc-200" />}
              </Button>
              
              <div className="flex-1 flex flex-col justify-center min-w-[120px]">
                <div 
                  className="flex gap-[2px] items-center w-full h-8 cursor-pointer relative group" 
                  onClick={(e) => {
                    if (!audioRef.current || !audioRef.current.duration) return;
                    const bounds = e.currentTarget.getBoundingClientRect();
                    const x = Math.max(0, Math.min(e.clientX - bounds.left, bounds.width));
                    const percentage = x / bounds.width;
                    audioRef.current.currentTime = percentage * audioRef.current.duration;
                  }}
                >
                  {waveform.current.map((height, i) => {
                    const isPlayed = (i / waveform.current.length) * 100 <= progress;
                    return (
                      <div 
                        key={i} 
                        className={`flex-1 rounded-full transition-colors duration-100 ${
                          isPlayed 
                            ? (isOwn ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-primary') 
                            : (isOwn ? 'bg-emerald-600/30 dark:bg-teal-700/50' : 'bg-zinc-300 dark:bg-zinc-700')
                        }`} 
                        style={{ height: `${height}%` }} 
                      />
                    );
                  })}
                  {/* Seek Handle */}
                  <div 
                    className={`absolute h-3 w-3 bg-white shadow-sm ring-1 ring-black/10 rounded-full top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${isOwn ? 'bg-emerald-100' : 'bg-white'}`}
                    style={{ left: `${progress}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] opacity-70 font-medium select-none text-zinc-700 dark:text-zinc-300">
                    {isPlaying || progress > 0 ? formatSeconds(currentTime) : formatSeconds(duration || message.duration || 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {messageType === 'file' && (
            <div className="flex items-center gap-2 p-2 bg-black/5 dark:bg-white/5 rounded-md min-w-[200px]">
              <FileText className="h-8 w-8 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fileName || 'Document'}</p>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => window.open(fileUrl)}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Time and Status */}
          <div className="flex items-center justify-end gap-1 mt-0.5 select-none">
            <span className="text-[10px] opacity-60 font-medium">
              {formatTime(createdAt)}
            </span>
            {getStatusIcon()}
          </div>
        </div>
      </div>
    </div>
  );
};

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Calendar, Briefcase, CreditCard } from 'lucide-react';

interface PurchasedService {
  id: string;
  title: string;
  image_url?: string;
  price?: number;
  currency?: string;
  category?: string;
}

export const UserProfileSheet: React.FC<{
  otherUser: any;
  purchasedServices?: PurchasedService[];
  children: React.ReactNode;
}> = ({ otherUser, purchasedServices, children }) => {
  const navigate = useNavigate();
  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md border-l border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden flex flex-col">
        <SheetHeader className="p-6 text-left border-b bg-muted/20">
          <SheetTitle className="text-xl font-black">User Profile</SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8">
            {/* User Info Section */}
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                <AvatarImage src={otherUser.profile_picture} />
                <AvatarFallback className="text-2xl font-bold">{otherUser.name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">{otherUser.name}</h2>
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-sm">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{otherUser.email || "No email provided"}</span>
                </div>
                {otherUser.status === 'online' && (
                  <Badge variant="success" className="mt-2 animate-pulse">Online Now</Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Account Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" /> About
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">Services Purchased</span>
                  </div>
                  <span className="text-lg font-black">{purchasedServices?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Purchased Services Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Purchased Services
              </h3>
              
              {purchasedServices && purchasedServices.length > 0 ? (
                <div className="space-y-3">
                  {purchasedServices.map((service) => (
                    <div 
                      key={service.id} 
                      onClick={() => navigate(`/dashboard/listing/${service.id}`)}
                      className="group relative flex items-center gap-4 p-3 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                    >
                      <div className="h-16 w-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                        {service.image_url ? (
                          <img src={service.image_url} alt={service.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground font-bold">
                            {service.title?.[0]}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm truncate group-hover:text-primary transition-colors">{service.title}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mb-1">{service.category || 'General'}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] py-0 h-4 bg-primary/5 border-primary/20 text-primary font-bold">
                            {service.price} {service.currency || 'PKR'}
                          </Badge>
                          <Badge variant="success" className="text-[10px] py-0 h-4 font-black uppercase tracking-tighter">
                            Active
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-border/60 bg-muted/20">
                  <p className="text-sm text-muted-foreground italic">No services purchased from this user yet.</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
        
        <div className="p-6 bg-muted/20 border-t">
          <p className="text-[10px] text-center text-muted-foreground font-medium uppercase tracking-[0.2em]">
            NearO Security Verified
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export const ConversationHeader: React.FC<{
  otherUser: any, 
  serviceName?: string, 
  purchasedServices?: PurchasedService[],
  onPhoneClick: () => void, 
  onVideoClick: () => void,
  onBack?: () => void
}> = ({ otherUser, serviceName, purchasedServices, onPhoneClick, onVideoClick, onBack }) => {
  return (
    <div className="h-20 px-4 flex items-center justify-between bg-[#f0f2f5] dark:bg-[#202c33] border-b border-zinc-200 dark:border-zinc-800 shrink-0">
      <UserProfileSheet otherUser={otherUser} purchasedServices={purchasedServices}>
        <div className="flex items-center gap-3 px-1 cursor-pointer group">
          {onBack ? (
            <Button onClick={(e) => { e.stopPropagation(); onBack(); }} size="icon" variant="ghost" className="h-10 w-10 md:hidden text-zinc-600 dark:text-zinc-400">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : null}
          <div className="relative">
            <Avatar className="h-10 w-10 group-hover:ring-2 ring-primary/50 transition-all">
              <AvatarImage src={otherUser.profile_picture} />
              <AvatarFallback>{otherUser.name?.[0]}</AvatarFallback>
            </Avatar>
            {otherUser.status === 'online' && (
              <span className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-background rounded-full" />
            )}
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">{otherUser.name}</h3>
            <div className="flex flex-wrap gap-1 mt-1">
              {purchasedServices && purchasedServices.length > 0 ? (
                purchasedServices.slice(0, 2).map(s => (
                  <Badge key={s.id} variant="success" className="text-[9px] px-1.5 py-0 h-4 font-bold uppercase tracking-tighter">
                    ✓ {s.title}
                  </Badge>
                ))
              ) : (
                <p className="text-[11px] opacity-60 leading-tight">
                  {otherUser.status === 'online' ? 'online' : (serviceName || 'Active now')}
                </p>
              )}
              {purchasedServices && purchasedServices.length > 2 && (
                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 font-bold">+{purchasedServices.length - 2}</Badge>
              )}
            </div>
          </div>
        </div>
      </UserProfileSheet>

      <div className="flex items-center gap-1">
        <Button onClick={onPhoneClick} size="icon" variant="ghost" className="h-10 w-10 text-zinc-600 dark:text-zinc-400">
          <Phone className="h-5 w-5" />
        </Button>
        <Button onClick={onVideoClick} size="icon" variant="ghost" className="h-10 w-10 text-zinc-600 dark:text-zinc-400">
          <Video className="h-5 w-5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-10 w-10 text-zinc-600 dark:text-zinc-400">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export const MessageInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onImageSelect: (f: File) => void;
  onVoiceSelect: (f: File) => void;
  disabled?: boolean;
}> = ({ value, onChange, onSend, onImageSelect, onVoiceSelect, disabled }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  
  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const cleanupRecording = () => {
    setIsRecording(false);
    setRecordingTime(0);
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorder.current = null;
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Voice recording is not supported in this browser');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();
      mediaRecorder.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (e) {
      alert('Microphone access denied or error occurred');
    }
  };

  const discardRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.onstop = () => {
        mediaRecorder.current?.stream.getTracks().forEach(t => t.stop());
        cleanupRecording();
      };
      mediaRecorder.current.stop();
    } else {
      cleanupRecording();
    }
  };

  const sendRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.onstop = () => {
        mediaRecorder.current?.stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        onVoiceSelect(file);
        cleanupRecording();
      };
      mediaRecorder.current.stop();
    }
  };

  if (isRecording) {
    return (
      <div className="px-4 py-2.5 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-between shrink-0 h-[60px]">
        <Button onClick={discardRecording} size="icon" variant="ghost" className="h-10 w-10 text-destructive hover:bg-destructive/10">
          <Trash2 className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3 animate-pulse">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-ping absolute ml-1" />
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span className="font-medium text-red-500 min-w-[50px] text-lg tracking-wider">
            {formatSeconds(recordingTime)}
          </span>
        </div>
        <Button onClick={sendRecording} size="icon" variant="ghost" className="h-10 w-10 text-primary bg-primary/10 hover:bg-primary/20 rounded-full">
          <Send className="h-5 w-5 ml-0.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 py-2.5 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center gap-3 shrink-0 min-h-[60px]">
      <input type="file" ref={fileRef} className="hidden" onChange={(e) => e.target.files?.[0] && onImageSelect(e.target.files[0])} />
      <Button size="icon" variant="ghost" className="h-10 w-10 text-zinc-600 dark:text-zinc-400" onClick={() => fileRef.current?.click()}>
        <Paperclip className="h-6 w-6" />
      </Button>
      <div className="flex-1">
        <Input 
          className="h-11 rounded-xl bg-white dark:bg-[#2a3942] border-zinc-200 dark:border-zinc-700 shadow-sm focus-visible:ring-primary px-4 text-[15px]"
          placeholder="Type a message..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), onSend())}
        />
      </div>
      {value.trim() ? (
        <Button onClick={onSend} size="icon" variant="ghost" className="h-11 w-11 text-white bg-primary rounded-full hover:bg-primary/90 shadow-sm transition-transform active:scale-95">
          <Send className="h-5 w-5" />
        </Button>
      ) : (
        <Button onClick={startRecording} size="icon" variant="ghost" className="h-11 w-11 text-zinc-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors active:scale-95">
          <MicIcon className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};
