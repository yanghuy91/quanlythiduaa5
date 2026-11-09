import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { ClassroomFullState } from './storageSync';

// Firebase configuration for Class 10A5
export const firebaseConfig = {
  apiKey: "AIzaSyA8MSKGCotV9hnGtf9sDrawu0JZh5frTO0",
  authDomain: "thiduaa5.firebaseapp.com",
  databaseURL: "https://thiduaa5-default-rtdb.firebaseio.com",
  projectId: "thiduaa5",
  storageBucket: "thiduaa5.firebasestorage.app",
  messagingSenderId: "476490186681",
  appId: "1:476490186681:web:7261ce4eabb733bc74c068",
  measurementId: "G-L0JNVPS481"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Google Auth Provider setup
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Real Google Sign-in with Popup (falls back to Redirect if popup is blocked)
 */
export async function loginWithGoogleFirebase(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    if (err.code === 'auth/popup-blocked') {
      console.warn('[GoogleAuth] Popup blocked by browser, redirecting seamlessly...');
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
}

/**
 * Direct Google Redirect sign-in (100% immune to popup blockers)
 */
export async function loginWithGoogleRedirect(): Promise<void> {
  await signInWithRedirect(auth, googleProvider);
}

/**
 * Check if the user just returned from a Google redirect
 */
export async function checkGoogleRedirectResult(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    return result ? result.user : null;
  } catch (err) {
    console.error('[GoogleRedirect] Error:', err);
    throw err;
  }
}

/**
 * Sign out of Firebase
 */
export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}

/**
 * Listen to auth state changes
 */
export function onFirebaseAuthStateChanged(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Fetch full classroom state from Cloud Firestore
 */
export async function fetchCloudClassState(): Promise<ClassroomFullState | null> {
  try {
    const docRef = doc(db, 'classes', '10a5');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as ClassroomFullState;
    }
    return null;
  } catch (err) {
    console.warn('[Firebase] Lỗi đọc Firestore:', err);
    return null;
  }
}

/**
 * Save full classroom state to Cloud Firestore
 */
export async function saveCloudClassState(state: ClassroomFullState): Promise<boolean> {
  try {
    const docRef = doc(db, 'classes', '10a5');
    await setDoc(docRef, {
      ...state,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firebase] Lỗi ghi Firestore:', err);
    return false;
  }
}

/**
 * Real-time listener for Cloud Firestore updates
 */
export function subscribeToCloudClassState(onUpdate: (state: ClassroomFullState) => void): () => void {
  try {
    const docRef = doc(db, 'classes', '10a5');
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as ClassroomFullState;
        if (data && Array.isArray(data.students)) {
          onUpdate(data);
        }
      }
    }, (error) => {
      console.warn('[Firebase] Lỗi lắng nghe realtime Firestore:', error);
    });
  } catch (err) {
    console.warn('[Firebase] Lỗi kết nối Firestore Realtime:', err);
    return () => {};
  }
}
