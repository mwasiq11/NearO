import React, { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Image as ImageIcon, Mic, Paperclip, Check, CheckCheck, Play, Download, FileText, File, Sheet, Presentation } from 'lucide-react';
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
    sender_name?: string;
    senderName?: string;
    sender_picture?: string;
    senderPicture?: string;
    status?: 'sent' | 'delivered' | 'read';
    isRead?: boolean;
    created_at?: string;
    createdAt?: string;
  };
  isOwn: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => {
  // Handle both snake_case (backend) and camelCase (frontend) field names
  const messageType = message.message_type || message.type || 'text';
  const fileUrl = message.file_url || message.fileUrl;
  const fileName = message.file_name || message.fileName;
  const fileSize = message.file_size || message.fileSize;
  const fileType = message.file_type || message.fileType;
  const senderName = message.sender_name || message.senderName || 'User';
  const senderPicture = message.sender_picture || message.senderPicture;
  const createdAt = message.created_at || message.createdAt || new Date().toISOString();
  const status = message.status || (message.isRead ? 'read' : 'sent');

  const getStatusIcon = () => {
    if (!isOwn) return null;
    if (status === 'read') return <CheckCheck className="h-3 w-3 text-blue-500" />;
    if (status === 'delivered') return <CheckCheck className="h-3 w-3" />;
    return <Check className="h-3 w-3" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const getFileIcon = (fileName?: string, fileType?: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    const type = fileType?.toLowerCase() || '';

    // PDF
    if (ext === 'pdf' || type.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    // Word documents
    if (ext === 'doc' || ext === 'docx' || type.includes('word')) {
      return <FileText className="h-5 w-5 text-blue-500" />;
    }
    // Excel spreadsheets
    if (ext === 'xls' || ext === 'xlsx' || type.includes('excel') || type.includes('spreadsheet')) {
      return <Sheet className="h-5 w-5 text-green-500" />;
    }
    // PowerPoint presentations
    if (ext === 'ppt' || ext === 'pptx' || type.includes('powerpoint') || type.includes('presentation')) {
      return <Presentation className="h-5 w-5 text-orange-500" />;
    }
    // Text files
    if (ext === 'txt' || ext === 'csv' || type.includes('text')) {
      return <FileText className="h-5 w-5 text-gray-500" />;
    }
    // Archives
    if (ext === 'zip' || type.includes('zip')) {
      return <File className="h-5 w-5 text-yellow-500" />;
    }
    // Default
    return <Paperclip className="h-5 w-5" />;
  };

  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      {!isOwn && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={senderPicture} />
          <AvatarFallback>{senderName?.[0]?.toUpperCase() || '?'}</AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <p className="text-xs text-muted-foreground mb-1">{senderName}</p>
        )}
        
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-muted text-foreground rounded-tl-sm'
          }`}
        >
          {messageType === 'text' && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}

          {messageType === 'image' && (
            <div className="space-y-2">
              <img
                src={fileUrl}
                alt="Shared image"
                className="rounded-lg max-w-xs max-h-64 object-cover cursor-pointer"
                onClick={() => window.open(fileUrl, '_blank')}
              />
              {message.content && <p className="text-sm">{message.content}</p>}
            </div>
          )}

          {messageType === 'voice' && (
            <div className="flex items-center gap-3 min-w-[200px]">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Play className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <div className="h-1 bg-current opacity-30 rounded-full">
                  <div className="h-1 bg-current w-0 rounded-full" />
                </div>
              </div>
              <span className="text-xs opacity-70">
                {message.duration ? `${message.duration}s` : '0:00'}
              </span>
            </div>
          )}

          {messageType === 'file' && (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-background/20 flex items-center justify-center">
                {getFileIcon(fileName, fileType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fileName}</p>
                <p className="text-xs opacity-70">{formatFileSize(fileSize)}</p>
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0"
                onClick={() => window.open(fileUrl, '_blank')}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className={`flex items-center gap-1 mt-1 px-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </span>
          {getStatusIcon()}
        </div>
      </div>
    </div>
  );
};

interface ConversationHeaderProps {
  otherUser: {
    name: string;
    email: string;
    profile_picture?: string;
    status?: 'online' | 'offline';
    last_seen?: string;
  };
  serviceName?: string;
}

export const ConversationHeader: React.FC<ConversationHeaderProps> = ({ otherUser, serviceName }) => {
  return (
    <Card className="border-b rounded-none p-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarImage src={otherUser.profile_picture} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {otherUser.name?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          {otherUser.status === 'online' && (
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{otherUser.name}</h3>
          <p className="text-sm text-muted-foreground truncate">
            {otherUser.status === 'online' 
              ? 'Online' 
              : otherUser.last_seen 
              ? `Last seen ${formatDistanceToNow(new Date(otherUser.last_seen), { addSuffix: true })}`
              : serviceName || otherUser.email
            }
          </p>
        </div>
      </div>
    </Card>
  );
};

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onImageSelect: (file: File) => void;
  onVoiceRecord: () => void;
  disabled?: boolean;
  isRecording?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSend,
  onImageSelect,
  onVoiceRecord,
  disabled = false,
  isRecording = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  return (
    <Card className="border-t rounded-none p-4">
      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
          className="hidden"
          onChange={handleFileSelect}
        />
        
        <Button
          size="icon"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="shrink-0"
        >
          <ImageIcon className="h-5 w-5" />
        </Button>

        <div className="flex-1">
          <Input
            placeholder="Type a message..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="resize-none"
          />
        </div>

        {value.trim() ? (
          <Button
            size="icon"
            onClick={onSend}
            disabled={disabled}
            className="shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            size="icon"
            variant={isRecording ? 'destructive' : 'ghost'}
            onClick={onVoiceRecord}
            disabled={disabled}
            className="shrink-0"
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </div>
    </Card>
  );
};
