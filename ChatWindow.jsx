import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Phone, 
  Video, 
  MoreVertical,
  Check,
  CheckCheck
} from 'lucide-react';

const ChatWindow = ({ otherUser }) => {
  const { currentUser } = useAuth();
  const { activeConversation, messages, sendMessage } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    await sendMessage(activeConversation, newMessage);
    setNewMessage('');
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  const isMessageRead = (message) => {
    return message.readBy && message.readBy.length > 1;
  };

  if (!activeConversation || !otherUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
          <p>Choose a friend to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser.avatar} />
            <AvatarFallback className="bg-blue-600 text-white">
              {getInitials(otherUser.displayName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{otherUser.displayName}</h3>
            <p className="text-sm text-gray-500">
              {otherUser.status === 'online' ? 'Online' : 'Last seen recently'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-4">👋</div>
            <p>Start your conversation with {otherUser.displayName}</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwnMessage = message.senderId === currentUser.uid;
              const showDate = index === 0 || 
                formatDate(messages[index - 1]?.timestamp) !== formatDate(message.timestamp);

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="text-center text-xs text-gray-500 my-4">
                      {formatDate(message.timestamp)}
                    </div>
                  )}
                  <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                      {!isOwnMessage && (
                        <Avatar className="h-8 w-8 mb-1">
                          <AvatarImage src={otherUser.avatar} />
                          <AvatarFallback className="bg-gray-400 text-white text-xs">
                            {getInitials(otherUser.displayName)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <Card className={`p-3 ${
                        isOwnMessage 
                          ? 'bg-blue-600 text-white ml-auto' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <div className={`flex items-center justify-end mt-1 space-x-1 ${
                          isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">{formatTime(message.timestamp)}</span>
                          {isOwnMessage && (
                            <div className="text-xs">
                              {isMessageRead(message) ? (
                                <CheckCheck className="h-3 w-3" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <Button type="button" variant="ghost" size="sm">
            <Paperclip className="h-4 w-4" />
          </Button>
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${otherUser.displayName}...`}
              className="pr-10"
            />
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;

