import React, { useState, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCheck, Check } from 'lucide-react';

const ConversationList = ({ onSelectConversation }) => {
  const { currentUser } = useAuth();
  const { conversations, activeConversation, setActiveConversation } = useChat();
  const [conversationUsers, setConversationUsers] = useState({});

  // Fetch user data for conversations
  useEffect(() => {
    const fetchUsers = async () => {
      const userPromises = conversations.map(async (conversation) => {
        const otherUserId = conversation.participants.find(id => id !== currentUser.uid);
        if (otherUserId && !conversationUsers[otherUserId]) {
          try {
            const userDoc = await getDoc(doc(db, 'users', otherUserId));
            if (userDoc.exists()) {
              return { [otherUserId]: userDoc.data() };
            }
          } catch (error) {
            console.error('Error fetching user:', error);
          }
        }
        return null;
      });

      const users = await Promise.all(userPromises);
      const usersMap = users.reduce((acc, user) => {
        if (user) {
          return { ...acc, ...user };
        }
        return acc;
      }, {});

      setConversationUsers(prev => ({ ...prev, ...usersMap }));
    };

    if (conversations.length > 0) {
      fetchUsers();
    }
  }, [conversations, currentUser.uid, conversationUsers]);

  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation.id);
    const otherUserId = conversation.participants.find(id => id !== currentUser.uid);
    const otherUser = conversationUsers[otherUserId];
    if (otherUser && onSelectConversation) {
      onSelectConversation(otherUser);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  const truncateMessage = (message, maxLength = 50) => {
    if (!message) return '';
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="text-4xl mb-4">💬</div>
        <p>No conversations yet</p>
        <p className="text-sm">Start chatting with your friends!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        const otherUserId = conversation.participants.find(id => id !== currentUser.uid);
        const otherUser = conversationUsers[otherUserId];
        const isActive = activeConversation === conversation.id;
        const isOwnLastMessage = conversation.lastMessageSender === currentUser.uid;

        if (!otherUser) {
          return (
            <div key={conversation.id} className="p-3 animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          );
        }

        return (
          <Card
            key={conversation.id}
            className={`p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
              isActive ? 'bg-blue-50 border-blue-200' : ''
            }`}
            onClick={() => handleSelectConversation(conversation)}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={otherUser.avatar} />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {getInitials(otherUser.displayName)}
                  </AvatarFallback>
                </Avatar>
                {otherUser.status === 'online' && (
                  <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm truncate">
                    {otherUser.displayName}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {formatTime(conversation.lastMessageTime)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center space-x-1 flex-1 min-w-0">
                    {isOwnLastMessage && (
                      <div className="text-gray-500">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                    <p className="text-sm text-gray-600 truncate">
                      {truncateMessage(conversation.lastMessage)}
                    </p>
                  </div>
                  
                  {/* Unread indicator - placeholder for now */}
                  {false && (
                    <Badge variant="destructive" className="h-5 w-5 p-0 text-xs">
                      2
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default ConversationList;

