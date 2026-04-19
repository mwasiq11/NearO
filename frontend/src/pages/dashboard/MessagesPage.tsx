import { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { MessageBubble, ConversationHeader, MessageInput } from '@/components/common/MessageComponents';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSounds } from '@/hooks/useSounds';
import { useCall } from '@/hooks/useCall';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  MessageCircle,
  Search,
  ChevronLeft,
} from 'lucide-react';

const MessagesPage = () => {
  const { user } = useAuth();
  const {
    conversations,
    currentConversation,
    currentMessages,
    openConversation,
    loadMessages,
    isUserOnline,
    startConversation,
  } = useChat();
  const { callState, initiateCall, acceptCall, declineCall, endCall } = useCall();
  const { playMessageSent } = useSounds();
  
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isMobileConversationOpen, setIsMobileConversationOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
      setIsMobileConversationOpen(true);
    }
  }, [currentConversation, loadMessages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMessages.length]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((conv: any) => {
      const otherUser = getOtherUser(conv);
      if (!otherUser) return false;
      return (
        otherUser.name.toLowerCase().includes(q) ||
        (conv.service_title && conv.service_title.toLowerCase().includes(q)) ||
        (conv.last_message_preview && conv.last_message_preview.toLowerCase().includes(q))
      );
    });
  }, [conversations, searchQuery]);

  const [globalUsers, setGlobalUsers] = useState<any[]>([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const fetchUsers = async () => {
        setIsSearchingGlobal(true);
        try {
          const res = await api.get<any[]>('/users', { auth: true });
          const q = searchQuery.toLowerCase();
          const matches = res.filter(u => u.id !== user?.id && (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)));
          setGlobalUsers(matches);
        } catch (e) {
          console.error('Failed to search global users', e);
        } finally {
          setIsSearchingGlobal(false);
        }
      };
      
      const timeoutId = setTimeout(fetchUsers, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setGlobalUsers([]);
    }
  }, [searchQuery, user]);

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
    <div className="flex-1 w-full min-h-0 p-0 md:p-4 overflow-hidden bg-[#e5e7eb] dark:bg-zinc-950 flex flex-col md:pb-4 pb-20">
      <div className="max-w-[1440px] mx-auto w-full flex-1 min-h-0 flex md:grid md:grid-cols-[380px_1fr] md:rounded-lg overflow-hidden md:shadow-2xl border border-zinc-200 dark:border-zinc-800">
        
        {/* Sidebar */}
        <div className={`flex flex-col bg-white dark:bg-[#111b21] border-r border-zinc-200 dark:border-zinc-800 w-full md:w-auto ${showMobileList ? 'flex' : 'hidden'} md:flex`}>
          <div className="p-4 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-between">
            <h3 className="text-xl font-bold">Chats</h3>
            {totalUnread > 0 && <Badge className="bg-primary text-white rounded-full">{totalUnread}</Badge>}
          </div>
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search or start new chat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#f0f2f5] dark:bg-[#202c33] border-none rounded-xl"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {searchQuery.trim().length > 0 && filteredConversations.length > 0 && (
              <div className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider bg-[#e5e7eb] dark:bg-[#182329]">
                Recent Chats
              </div>
            )}
            
            {filteredConversations.map((conv: any) => {
              const other = getOtherUser(conv);
              const active = currentConversation?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => handleOpenConversation(conv)}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-colors ${active ? 'bg-[#ebebeb] dark:bg-[#2a3942]' : ''}`}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={other?.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${other?.name || 'User'}`} />
                    <AvatarFallback>{other?.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="font-semibold text-sm truncate">{other?.name}</h4>
                      {conv.last_message_at && (
                        <span className="text-[11px] opacity-60">{formatConversationTime(conv.last_message_at)}</span>
                      )}
                    </div>
                    {conv.last_message_preview && (
                      <p className="text-xs opacity-60 truncate">{conv.last_message_preview}</p>
                    )}
                  </div>
                </button>
              );
            })}

            {globalUsers.length > 0 && (
              <>
                <div className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider bg-[#e5e7eb] dark:bg-[#182329]">
                  All Contacts
                </div>
                {globalUsers.map((gUser: any) => {
                  const alreadyInChat = conversations.some((c: any) => c.seeker_id === gUser.id || c.provider_id === gUser.id);
                  if (alreadyInChat) return null;
                  
                  return (
                    <button
                      key={gUser.id}
                      onClick={() => handleStartNewChat(gUser)}
                      className="w-full flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-colors"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={gUser.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${gUser.name}`} />
                        <AvatarFallback>{gUser.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h4 className="font-semibold text-sm truncate">{gUser.name}</h4>
                        </div>
                        <p className="text-xs opacity-60 truncate">Start new chat</p>
                      </div>
                    </button>
                  );
                })}
              </>
            )}

            {!filteredConversations.length && !globalUsers.length && searchQuery && !isSearchingGlobal && (
              <div className="p-8 text-center text-zinc-500 text-sm">
                No users or chats found matching "{searchQuery}"
              </div>
            )}
            
            {isSearchingGlobal && (
              <div className="p-8 text-center text-zinc-500 text-sm animate-pulse">
                Searching directory...
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Main Chat Area */}
        <div className={`flex flex-col bg-[#efeae2] dark:bg-[#0b141a] w-full md:w-auto min-h-0 ${showMobileList ? 'hidden md:flex' : 'flex'}`}>
          {currentConversation ? (
            <>
              <ConversationHeader
                otherUser={getCurrentOtherUser()!}
                serviceName={currentConversation.service_title}
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
              
              <ScrollArea className="flex-1 relative chat-wallpaper">
                <div className="px-4 py-6 md:px-12 max-w-5xl mx-auto space-y-1">
                  {groupedMessages.map((group) => (
                    <div key={group.date} className="space-y-1">
                      <div className="flex justify-center my-4">
                        <span className="bg-white dark:bg-[#111b21] px-3 py-1.5 rounded-lg text-[11px] font-medium shadow-sm uppercase tracking-wider">
                          {group.date}
                        </span>
                      </div>
                      {group.messages.map((msg) => (
                        <MessageBubble
                          key={msg.id}
                          message={msg as any}
                          isOwn={msg.senderId === user?.id || (msg as any).sender_id === user?.id}
                        />
                      ))}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <MessageInput
                value={message}
                onChange={setMessage}
                onSend={handleSend}
                onImageSelect={handleImageSelect}
                onVoiceSelect={handleImageSelect}
                disabled={isUploading || isSending}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#f0f2f5] dark:bg-[#222e35]">
              <div className="bg-zinc-200 dark:bg-zinc-800 p-8 rounded-full mb-6">
                <MessageCircle className="h-24 w-24 text-zinc-400" />
              </div>
              <h2 className="text-3xl font-bold mb-4 hidden md:block">NearO Web</h2>
              <p className="max-w-md text-zinc-500 text-lg hidden md:block">Send and receive messages without keeping your phone online. Use NearO on up to 4 linked devices at the same time.</p>
              <button
                onClick={handleBackToList}
                className="md:hidden inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to chats
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
