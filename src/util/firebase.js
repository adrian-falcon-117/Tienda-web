import { initializeApp } from 'firebase/app';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDDES5oGtGdHiiTaQEJQ-X2KlN65vTzaG4",
    authDomain: "prueba-9bb0f.firebaseapp.com",
    projectId: "prueba-9bb0f",
    storageBucket: "prueba-9bb0f.firebasestorage.app",
    messagingSenderId: "348973077346",
    appId: "1:348973077346:web:d989624ccb2740643dd23b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);