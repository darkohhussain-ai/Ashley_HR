import * as firebaseApp from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC-1Kb9R8HyvegcSMlnc3R1SLp5HX-aX48",
  authDomain: "ashley-expense-tracker.firebaseapp.com",
  projectId: "ashley-expense-tracker",
  storageBucket: "ashley-expense-tracker.firebasestorage.app",
  messagingSenderId: "364875286088",
  appId: "1:364875286088:web:8f7ef7bc1e7436b4adfa7d"
};

const app = firebaseApp.initializeApp(firebaseConfig);
export const db = getFirestore(app);