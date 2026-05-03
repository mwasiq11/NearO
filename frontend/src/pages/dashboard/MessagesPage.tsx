import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { MessageBubble, ConversationHeader, MessageInput } from '@/components/common/MessageComponents';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSounds } from '@/hooks/useSounds';
import { useCall } from '@/hooks/useCall';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  MessageCircle,
  Search,
  ChevronLeft,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

import { useDebounce } from '@/hooks/useDebounce';
import { Skeleton } from 'boneyard-js/react';

const MessagesPage = () => {
  const { user } = useAuth();
  const {
    conversations,
    currentConversation,
    currentMessages,
    openConversation,
    closeConversation,
    loadMessages,
    isUserOnline,
    startConversation,
    isLoading: chatLoading,
  } = useChat();
  
  const { callState, initiateCall, acceptCall, declineCall, endCall } = useCall();
  const { playMessageSent } = useSounds();
  
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const [isSending, setIsSending] = useState(false);
  const [isMobileConversationOpen, setIsMobileConversationOpen] = useState(false);
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const targetConversationId = searchParams.get('conversationId');

  useEffect(() => {
    if (!targetConversationId) {
      closeConversation();
      setIsMobileConversationOpen(false);
    }
  }, []); // Run only on initial mount to clear previous state

  useEffect(() => {
    if (!targetConversationId || conversations.length === 0) return;

    const target = conversations.find((c: any) => c.id === targetConversationId);
    if (target) {
      openConversation(target);
      setIsMobileConversationOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('conversationId');
      setSearchParams(next, { replace: true });
    }
  }, [conversations, openConversation, searchParams, setSearchParams, targetConversationId]);

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
    }
  }, [currentConversation, loadMessages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMessages.length]);

  const filteredConversations = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return conversations;
    const q = debouncedSearchQuery.toLowerCase();
    return conversations.filter((conv: any) => {
      const otherUser = getOtherUser(conv);
      if (!otherUser) return false;
      return (
        otherUser.name.toLowerCase().includes(q) ||
        (conv.service_title && conv.service_title.toLowerCase().includes(q)) ||
        (conv.last_message_preview && conv.last_message_preview.toLowerCase().includes(q))
      );
    });
  }, [conversations, debouncedSearchQuery, getOtherUser]);

  const [globalUsers, setGlobalUsers] = useState<any[]>([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);

  useEffect(() => {
    if (debouncedSearchQuery.trim().length > 1) {
      const fetchUsers = async () => {
        setIsSearchingGlobal(true);
        try {
          const res = await api.get<any[]>('/users', { auth: true });
          const q = debouncedSearchQuery.toLowerCase();
          const matches = res.filter(u => u.id !== user?.id && (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)));
          setGlobalUsers(matches);
        } catch (e) {
          console.error('Failed to search global users', e);
        } finally {
          setIsSearchingGlobal(false);
        }
      };
      fetchUsers();
    } else {
      setGlobalUsers([]);
    }
  }, [debouncedSearchQuery, user]);

  function getOtherUser(convo: any) {
    if (!user) return null;
    
    // Default conversation loaded from backend 
    if (convo.seeker_id || convo.provider_id) {
      const isSeeker = convo.seeker_id === user.id;
      return {
        id: isSeeker ? convo.provider_id : convo.seeker_id,
        name: (isSeeker ? convo.provider_name : convo.seeker_name) || 'User',
        email: (isSeeker ? convo.provider_email : convo.seeker_email) || '',
        profile_picture: isSeeker ? convo.provider_picture : convo.seeker_picture,
      };
    }

    // Temporary mocked conversation when clicking from global search
    const otherId = convo.participants?.find((p: string) => p !== user.id);
    return {
      id: otherId,
      name: convo.other_name || 'User',
      email: convo.other_email || '',
      profile_picture: convo.other_picture
    };
  }

  const handleSend = async () => {
    if (!message.trim() || !currentConversation || !user || isSending) return;

    const messageContent = message.trim();
    setMessage('');
    setIsSending(true);

    try {
      const otherUser = getOtherUser(currentConversation);
      if (!otherUser) return;

      if (currentConversation.id.startsWith('pending-')) {
        startConversation(otherUser.id, undefined, messageContent);
      } else {
        await api.post('/messages/send', {
          conversationId: currentConversation.id,
          receiverId: otherUser.id,
          content: messageContent,
          messageType: 'text',
          serviceId: currentConversation.listingId
        }, { auth: true });
        loadMessages(currentConversation.id, true);
      }

      playMessageSent();
    } catch (error) {
      toast.error('Failed to send message');
      setMessage(messageContent);
      console.error('Send message error:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleImageSelect = async (file: File) => {
    if (!currentConversation || !user) return;

    try {
      setIsUploading(true);
      const otherUser = getOtherUser(currentConversation);
      if (!otherUser) return;

      let messageType = 'file';
      if (file.type.startsWith('image/')) {
        messageType = 'image';
      } else if (file.type.startsWith('audio/')) {
        messageType = 'voice';
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', currentConversation.id);
      formData.append('receiverId', otherUser.id);
      formData.append('messageType', messageType);
      formData.append('upload_context', `message_${messageType}`);

      await api.post('/messages/send', formData, { auth: true });
      playMessageSent();
      loadMessages(currentConversation.id, true);
    } catch (error) {
      toast.error('Failed to send file');
      console.error('File upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Voice recording is now fully handled inside MessageInput locally 
  // It handles its own media streams and passes the built File block directly to handleImageSelect

  const getCurrentOtherUser = () => {
    if (!currentConversation) return null;
    const otherUser = getOtherUser(currentConversation);
    if (!otherUser) return null;
    return {
      ...otherUser,
      status: isUserOnline(otherUser.id) ? 'online' as const : 'offline' as const,
    };
  };

  const formatConversationTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: typeof currentMessages }[] = [];
    let currentDate = '';
    currentMessages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });
    return groups;
  }, [currentMessages]);

  const totalUnread = useMemo(() => {
    return conversations.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);
  }, [conversations]);

  const handleOpenConversation = (conv: any) => {
    openConversation(conv);
    setIsMobileConversationOpen(true);
  };

  const handleStartNewChat = (globalUser: any) => {
    const existing = conversations.find((c: any) =>
      c.seeker_id === globalUser.id || c.provider_id === globalUser.id || (c.participants && c.participants.includes(globalUser.id))
    );
    if (existing) {
      handleOpenConversation(existing);
      return;
    }
    
    const tempConv = {
      id: `pending-${globalUser.id}`,
      participants: [user?.id, globalUser.id],
      other_name: globalUser.name,
      other_email: globalUser.email,
      other_picture: globalUser.profile_picture,
      unreadCount: 0,
      createdAt: new Date().toISOString()
    };
    
    handleOpenConversation(tempConv);
  };

  const handleBackToList = () => {
    setIsMobileConversationOpen(false);
  };

  const showMobileList = !isMobileConversationOpen;

  return (
    <div className="flex-1 w-full min-h-0 overflow-hidden bg-background flex flex-col relative">
      <div className="flex-1 w-full flex overflow-hidden relative">
        
        {/* Sidebar / Chat List */}
        <div className={cn(
          "flex flex-col bg-card border-r border-border w-full md:w-[380px] lg:w-[420px] transition-all duration-300",
          !showMobileList && isMobile ? "hidden" : "flex",
          "md:flex"
        )}>
          <div className="p-4 md:p-6 bg-muted/30 flex items-center justify-between border-b">
            <h3 className="text-xl md:text-2xl font-bold tracking-tight">Messages</h3>
            {totalUnread > 0 && (
              <Badge variant="destructive" className="rounded-full px-2 py-0.5 text-xs font-bold shadow-sm">
                {totalUnread}
              </Badge>
            )}
          </div>
          
          <div className="p-3 md:p-4 sticky top-0 z-10 bg-card">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-muted/50 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <Skeleton name="conversations-list" loading={chatLoading}>
              <div className="pb-24 md:pb-4">
              {searchQuery.trim().length > 0 && filteredConversations.length > 0 && (
                <div className="px-5 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
                  Recent
                </div>
              )}
              
              <div className="divide-y divide-border/40">
                {filteredConversations.map((conv: any) => {
                  const other = getOtherUser(conv);
                  const active = currentConversation?.id === conv.id;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleOpenConversation(conv)}
                      className={cn(
                        "w-full flex items-center gap-4 px-4 py-4 transition-all active:bg-muted/80",
                        active ? "bg-primary/5 md:bg-primary/10" : "hover:bg-muted/50"
                      )}
                    >
                      <div className="relative">
                        <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                          <AvatarImage src={other?.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${other?.name || 'User'}`} />
                          <AvatarFallback>{other?.name?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        {isUserOnline(other?.id) && (
                          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-emerald-500 border-2 border-background rounded-full shadow-sm" title="Online" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h4 className={cn("font-bold text-sm truncate", conv.unreadCount > 0 ? "text-foreground" : "text-foreground/90")}>
                            {other?.name}
                          </h4>
                          {conv.last_message_at && (
                            <span className="text-[11px] font-medium text-muted-foreground">
                              {formatConversationTime(conv.last_message_at)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn(
                            "text-xs truncate max-w-[180px]",
                            conv.unreadCount > 0 ? "font-bold text-foreground" : "text-muted-foreground"
                          )}>
                            {conv.last_message_preview || "Start a conversation"}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="flex-shrink-0 h-5 min-w-[20px] px-1 bg-primary text-primary-foreground text-[10px] font-black rounded-full flex items-center justify-center shadow-lg">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        {conv.purchased_services && conv.purchased_services.length > 0 ? (
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="success" className="text-[9px] px-1 py-0 h-3.5 font-black uppercase tracking-tighter">
                              ✓ {conv.purchased_services[0].title}
                              {conv.purchased_services.length > 1 && ` +${conv.purchased_services.length - 1}`}
                            </Badge>
                          </div>
                        ) : conv.service_title ? (
                          <span className="inline-block mt-1 text-[10px] font-medium text-primary/60 truncate max-w-[150px]">
                            Re: {conv.service_title}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>

              {globalUsers.length > 0 && (
                <>
                  <div className="px-5 py-3 mt-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
                    New Contacts
                  </div>
                  <div className="divide-y divide-border/40">
                    {globalUsers.map((gUser: any) => {
                      const alreadyInChat = conversations.some((c: any) => c.seeker_id === gUser.id || c.provider_id === gUser.id);
                      if (alreadyInChat) return null;
                      
                      return (
                        <button
                          key={gUser.id}
                          onClick={() => handleStartNewChat(gUser)}
                          className="w-full flex items-center gap-4 px-4 py-4 hover:bg-muted/50 transition-all active:bg-muted/80"
                        >
                          <Avatar className="h-14 w-14 border-2 border-background shadow-sm grayscale-[0.3]">
                            <AvatarImage src={gUser.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${gUser.name}`} />
                            <AvatarFallback>{gUser.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 text-left">
                            <h4 className="font-bold text-sm truncate">{gUser.name}</h4>
                            <p className="text-xs text-muted-foreground truncate">Tap to message</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {!filteredConversations.length && !globalUsers.length && searchQuery && !isSearchingGlobal && (
                <div className="p-12 text-center text-muted-foreground space-y-2">
                  <div className="text-3xl">🔍</div>
                  <p className="text-sm font-medium">No results for "{searchQuery}"</p>
                </div>
              )}
              
              {isSearchingGlobal && (
                <div className="p-12 text-center text-muted-foreground">
                  <div className="h-5 w-5 border-2 border-primary border-t-transparent animate-spin rounded-full mx-auto" />
                </div>
              )}
            </div>
          </Skeleton>
        </ScrollArea>
        </div>

        {/* Chat Detail View */}
        <div className={cn(
          "flex-1 flex flex-col bg-muted/5 relative transition-transform duration-300",
          showMobileList && isMobile ? "translate-x-full md:translate-x-0" : "translate-x-0",
          !currentConversation && isMobile ? "hidden" : "flex",
           "md:flex"
        )}>
          {currentConversation ? (
            <div className="flex flex-col h-full overflow-hidden">
              <ConversationHeader
                otherUser={getCurrentOtherUser()!}
                serviceName={currentConversation.service_title}
                purchasedServices={(currentConversation as any).purchased_services}
                onBack={handleBackToList}
                onPhoneClick={() => {
                  const other = getOtherUser(currentConversation);
                  initiateCall(other!.id, other!.name, other!.profile_picture, 'audio');
                }}
                onVideoClick={() => {
                  const other = getOtherUser(currentConversation);
                  initiateCall(other!.id, other!.name, other!.profile_picture, 'video');
                }}
              />
              
              <ScrollArea className="flex-1 relative bg-muted/5">
                <div className="px-4 py-8 md:px-12 max-w-4xl mx-auto space-y-6">
                  {groupedMessages.map((group) => (
                    <div key={group.date} className="space-y-4">
                      <div className="flex justify-center sticky top-2 z-10">
                        <span className="bg-background/80 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-muted-foreground shadow-sm border uppercase tracking-widest">
                          {group.date}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {group.messages.map((msg) => (
                          <MessageBubble
                            key={msg.id}
                            message={msg as any}
                            isOwn={msg.senderId === user?.id || (msg as any).sender_id === user?.id}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              </ScrollArea>

              <div className="p-2 md:p-4 bg-background/50 backdrop-blur-md border-t">
                <MessageInput
                  value={message}
                  onChange={setMessage}
                  onSend={handleSend}
                  onImageSelect={handleImageSelect}
                  onVoiceSelect={handleImageSelect}
                  disabled={isUploading || isSending}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
              <div className="bg-primary/5 p-10 rounded-full mb-8 relative">
                <MessageCircle className="h-20 w-20 text-primary/20" />
                <div className="absolute inset-0 border-2 border-primary/10 border-dashed rounded-full animate-[spin_20s_linear_infinite]" />
              </div>
              <h2 className="text-3xl font-black mb-3 tracking-tight">Select a Chat</h2>
              <p className="max-w-xs text-muted-foreground text-sm font-medium leading-relaxed">
                Choose a conversation from the left to start messaging. Your chats are secured with end-to-end encryption.
              </p>
              {isMobile && (
                <Button
                  onClick={handleBackToList}
                  size="lg"
                  className="mt-8 rounded-2xl px-8 font-bold shadow-xl shadow-primary/20"
                >
                  View Conversations
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
