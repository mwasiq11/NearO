import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';

const MessagesPage = () => {
  const { user } = useAuth();
  const {
    conversations,
    currentConversation,
    currentMessages,
    openConversation,
    loadMessages,
    sendMessage,
  } = useChat();
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
    }
  }, [currentConversation, loadMessages]);

  const displayConversations = useMemo(() => conversations, [conversations]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage(message.trim());
    setMessage('');
  };

  const getConversationLabel = (conversationId: string) => {
    const convo = conversations.find(c => c.id === conversationId);
    if (!convo || !user) return 'Conversation';
    const otherId = convo.participants.find(p => p !== user.id);
    const other = convo.participantDetails?.find(p => p.id === otherId);
    return other?.name || other?.email || 'Conversation';
  };

  return (
    <div className="p-6 h-[calc(100vh-120px)]">
      <div className="grid h-full md:grid-cols-[280px_1fr] gap-4">
        <Card className="p-4 overflow-auto">
          <h3 className="font-semibold mb-3">Conversations</h3>
          <div className="space-y-2">
            {displayConversations.map((conv) => {
              const label = getConversationLabel(conv.id);
              return (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className={`w-full text-left p-3 rounded-lg border ${
                    currentConversation?.id === conv.id ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <p className="font-medium truncate">{label}</p>
                  {conv.listing && (
                    <p className="text-xs text-muted-foreground truncate">{conv.listing.title}</p>
                  )}
                </button>
              );
            })}
            {displayConversations.length === 0 && (
              <div className="text-sm text-muted-foreground">No conversations yet.</div>
            )}
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="border-b p-4">
            <h3 className="font-semibold">
              {currentConversation ? getConversationLabel(currentConversation.id) : 'Select a conversation'}
            </h3>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {currentConversation ? (
              currentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                    msg.senderId === user?.id
                      ? 'ml-auto bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {msg.content}
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">Choose a conversation to start chatting.</div>
            )}
          </div>
          {currentConversation && (
            <div className="border-t p-4 flex gap-2">
              <Input
                placeholder="Type a message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button onClick={handleSend}>Send</Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MessagesPage;

