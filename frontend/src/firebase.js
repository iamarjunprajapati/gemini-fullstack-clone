// फाइल: src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// यहाँ अपना कॉपी किया हुआ firebaseConfig ऑब्जेक्ट पेस्ट करें
const firebaseConfig = {
  apiKey: "AIzaSyD6TKPAoPApwl-REwN0Ax66xcGURzNinzs",
  authDomain: "my-chat-project-429e4.firebaseapp.com",
  projectId: "my-chat-project-429e4",
  storageBucket: "my-chat-project-429e4.firebasestorage.app",
  messagingSenderId: "961497651121",
  appId: "1:961497651121:web:a6850854b2c59c8f0d8f90",
  measurementId: "G-87NCLXV8WM"
};

// Firebase को शुरू करें
const app = initializeApp(firebaseConfig);

// ज़रूरी चीज़ों को एक्सपोर्ट करें
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();