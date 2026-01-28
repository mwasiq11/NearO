import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { MessageBubble, ConversationHeader, MessageInput } from '@/components/common/MessageComponents';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const MessagesPage = () => {
  const { user } = useAuth();
  const {
    conversations,
    currentConversation,
    currentMessages,
    openConversation,
    loadMessages,
    isUserOnline,
  } = useChat();
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
    }
  }, [currentConversation, loadMessages]);

  const displayConversations = useMemo(() => conversations, [conversations]);

  const getOtherUser = (convo: any) => {
    if (!user) return null;
    const isSeeker = convo.seeker_id === user.id;
    return {
      id: isSeeker ? convo.provider_id : convo.seeker_id,
      name: (isSeeker ? convo.provider_name : convo.seeker_name) || 'User',
      email: (isSeeker ? convo.provider_email : convo.seeker_email) || '',
      profile_picture: isSeeker ? convo.provider_picture : convo.seeker_picture,
    };
  };

  const handleSend = async () => {
    if (!message.trim() || !currentConversation || !user) return;

    try {
      const otherUser = getOtherUser(currentConversation);
      if (!otherUser) return;

      await api.post('/messages/send', {
        conversationId: currentConversation.id,
        receiverId: otherUser.id,
        content: message.trim(),
        messageType: 'text',
      }, { auth: true });

      setMessage('');
      loadMessages(currentConversation.id);
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Send message error:', error);
    }
  };

  const handleImageSelect = async (file: File) => {
    if (!currentConversation || !user) return;

    try {
      setIsUploading(true);
      const otherUser = getOtherUser(currentConversation);
      if (!otherUser) return;

      // Determine message type based on file type
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

      loadMessages(currentConversation.id);
      
      if (messageType === 'image') {
        toast.success('Image sent');
      } else if (messageType === 'voice') {
        toast.success('Audio sent');
      } else {
        toast.success('File sent');
      }
    } catch (error) {
      toast.error('Failed to send file');
      console.error('File upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleVoiceRecord = () => {
    toast.info('Voice recording coming soon');
  };

  const getCurrentOtherUser = () => {
    if (!currentConversation) return null;
    const otherUser = getOtherUser(currentConversation);
    if (!otherUser) return null;
    
    return {
      ...otherUser,
      status: isUserOnline(otherUser.id) ? 'online' as const : 'offline' as const,
    };
  };

  return (
    <div className="p-6 h-[calc(100vh-120px)]">
      <div className="grid h-full md:grid-cols-[320px_1fr] gap-4">
        {/* Conversations List */}
        <Card className="p-0 overflow-hidden flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-lg">Messages</h3>
            <p className="text-sm text-muted-foreground">
              {displayConversations.length} conversation{displayConversations.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {displayConversations.map((conv) => {
                const otherUser = getOtherUser(conv);
                if (!otherUser) return null;

                const isOnline = isUserOnline(otherUser.id);

                return (
                  <button
                    key={conv.id}
                    onClick={() => openConversation(conv)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentConversation?.id === conv.id
                        ? 'bg-primary/10 border-primary/20 border'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={otherUser.profile_picture} />
                          <AvatarFallback className="bg-primary/10">
                            {otherUser.name?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        {isOnline && (
                          <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium truncate">{otherUser.name}</p>
                          {conv.last_message_at && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(conv.last_message_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {conv.service_title && (
                          <p className="text-xs text-muted-foreground truncate mb-1">
                            {conv.service_title}
                          </p>
                        )}
                        {conv.last_message_preview && (
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.last_message_preview}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
              {displayConversations.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No conversations yet. Start by booking a service!
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <div className="flex flex-col h-full overflow-hidden rounded-lg border">
          {currentConversation ? (
            <>
              <ConversationHeader
                otherUser={getCurrentOtherUser()!}
                serviceName={currentConversation.service_title}
              />
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-1">
                  {currentMessages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={msg.sender_id === user?.id}
                    />
                  ))}
                  {currentMessages.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      No messages yet. Start the conversation!
                    </div>
                  )}
                </div>
              </ScrollArea>

              <MessageInput
                value={message}
                onChange={setMessage}
                onSend={handleSend}
                onImageSelect={handleImageSelect}
                onVoiceRecord={handleVoiceRecord}
                disabled={isUploading}
                isRecording={false}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">No conversation selected</p>
                <p className="text-sm">Choose a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;

