import { initializeApp } from "firebase/app";
import {
  getFirestore,
  setLogLevel,
} from "firebase/firestore";

import { getAuth } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyDGIJXX3MR1CxmIJbJHyVzbfRa0M0Sw6FQ",
  authDomain: "rajbiosis-central.firebaseapp.com",
  projectId: "rajbiosis-central",
  storageBucket: "rajbiosis-central.firebasestorage.app",
  messagingSenderId: "190335913620",
  appId: "1:190335913620:web:99a14edcbb528f06c1ee81"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
setLogLevel("silent");

export const auth = getAuth(app);