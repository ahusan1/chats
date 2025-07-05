import { useEffect } from 'react';
import { doc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export const useSessionManager = () => {
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const sessionId = `${currentUser.uid}_${Date.now()}`;
    const sessionRef = doc(db, 'activeSessions', currentUser.uid);

    // Create session document
    const createSession = async () => {
      try {
        await setDoc(sessionRef, {
          sessionId,
          userId: currentUser.uid,
          createdAt: new Date(),
          lastActivity: new Date()
        });
      } catch (error) {
        console.error('Error creating session:', error);
      }
    };

    // Listen for session changes
    const unsubscribe = onSnapshot(sessionRef, (doc) => {
      if (doc.exists()) {
        const sessionData = doc.data();
        // If session ID doesn't match current session, logout
        if (sessionData.sessionId !== sessionId) {
          logout();
        }
      }
    });

    // Update last activity periodically
    const updateActivity = () => {
      if (currentUser) {
        setDoc(sessionRef, {
          sessionId,
          userId: currentUser.uid,
          createdAt: new Date(),
          lastActivity: new Date()
        }, { merge: true }).catch(console.error);
      }
    };

    // Create initial session
    createSession();

    // Update activity every 30 seconds
    const activityInterval = setInterval(updateActivity, 30000);

    // Update activity on user interaction
    const handleActivity = () => updateActivity();
    window.addEventListener('click', handleActivity);
    window.addEventListener('keypress', handleActivity);

    // Cleanup on unmount
    return () => {
      unsubscribe();
      clearInterval(activityInterval);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      
      // Remove session on logout
      if (currentUser) {
        deleteDoc(sessionRef).catch(console.error);
      }
    };
  }, [currentUser, logout]);
};

