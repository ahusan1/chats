import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get or create conversation between two users
  const getOrCreateConversation = async (otherUserId) => {
    if (!currentUser) return null;

    try {
      const conversationId = [currentUser.uid, otherUserId].sort().join('_');
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);

      if (!conversationDoc.exists()) {
        // Create new conversation
        await setDoc(conversationRef, {
          id: conversationId,
          participants: [currentUser.uid, otherUserId],
          createdAt: serverTimestamp(),
          lastMessage: null,
          lastMessageTime: serverTimestamp(),
          type: 'direct'
        });
      }

      setActiveConversation(conversationId);
      return conversationId;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  // Send a message
  const sendMessage = async (conversationId, content, type = 'text') => {
    if (!currentUser || !content.trim()) return;

    try {
      const messageData = {
        senderId: currentUser.uid,
        content: content.trim(),
        type,
        timestamp: serverTimestamp(),
        conversationId,
        readBy: [currentUser.uid]
      };

      // Add message to messages collection
      await addDoc(collection(db, 'messages'), messageData);

      // Update conversation's last message
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        lastMessage: content.trim(),
        lastMessageTime: serverTimestamp(),
        lastMessageSender: currentUser.uid
      });

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (conversationId) => {
    if (!currentUser) return;

    try {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        where('readBy', 'not-in', [[currentUser.uid]])
      );

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        snapshot.docs.forEach(async (messageDoc) => {
          await updateDoc(messageDoc.ref, {
            readBy: arrayUnion(currentUser.uid)
          });
        });
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Listen to conversations
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
      const conversationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setConversations(conversationsList);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  // Listen to messages for active conversation
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', activeConversation),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messagesList);
    });

    return unsubscribe;
  }, [activeConversation]);

  const value = {
    conversations,
    activeConversation,
    messages,
    loading,
    setActiveConversation,
    getOrCreateConversation,
    sendMessage,
    markMessagesAsRead
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

