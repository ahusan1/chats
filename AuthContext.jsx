import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Sign up function
  const signup = async (email, password, username, displayName) => {
    try {
      // Check if username is already taken
      const usernameDoc = await getDoc(doc(db, 'usernames', username));
      if (usernameDoc.exists()) {
        throw new Error('Username is already taken');
      }

      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile
      await updateProfile(user, { displayName });

      // Create user document in Firestore
      const userDoc = {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        username: username,
        isVerified: false,
        isAdmin: false,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        status: 'online',
        avatar: null,
        friends: [],
        friendRequests: [],
        sentRequests: []
      };

      await setDoc(doc(db, 'users', user.uid), userDoc);
      
      // Reserve username
      await setDoc(doc(db, 'usernames', username), { uid: user.uid });

      return user;
    } catch (error) {
      throw error;
    }
  };

  // Sign in function
  const signin = async (email, password) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last seen and status
      await updateDoc(doc(db, 'users', user.uid), {
        lastSeen: serverTimestamp(),
        status: 'online'
      });

      return user;
    } catch (error) {
      throw error;
    }
  };

  // Sign out function
  const logout = async () => {
    try {
      if (currentUser) {
        // Update status to offline
        await updateDoc(doc(db, 'users', currentUser.uid), {
          status: 'offline',
          lastSeen: serverTimestamp()
        });
      }
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    if (currentUser) {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Fetch user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    signin,
    logout,
    updateUserProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

