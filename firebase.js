// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBQYYRPkOhUQTCCEIdah0ji6iVkH22RUZc",
  authDomain: "tech-news-574f9.firebaseapp.com",
  projectId: "tech-news-574f9",
  storageBucket: "tech-news-574f9.firebasestorage.app",
  messagingSenderId: "82300143313",
  appId: "1:82300143313:web:32229fbf53bbe81267e7f0",
  measurementId: "G-5BWVEG064L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;

