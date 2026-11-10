import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  signInWithCredential,
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
import {
  getDatabase,
  ref as rtdbRef,
  set as rtdbSet,
  get as rtdbGet,
  onValue as rtdbOnValue
} from 'firebase/database';
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

// Initialize Firebase App & Services
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

// Google Auth Provider setup
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Authorized Teacher Emails Whitelist (Only GVCN email has access to manage Class 10A5)
 */
export const DEFAULT_AUTHORIZED_TEACHER_EMAILS = [
  'yanghuy91@gmail.com',
];

export function isAuthorizedTeacherEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  
  if (DEFAULT_AUTHORIZED_TEACHER_EMAILS.some(e => e.toLowerCase() === normalized)) {
    return true;
  }
  
  // Also check dynamic settings in localStorage
  try {
    const rawSettings = localStorage.getItem('app_teacher_settings');
    if (rawSettings) {
      const parsed = JSON.parse(rawSettings);
      if (parsed?.emailGiaoVien && parsed.emailGiaoVien.trim().toLowerCase() === normalized) {
        return true;
      }
    }
  } catch (e) {}

  return false;
}

/**
 * Real Google Sign-in with Popup
 */
export async function loginWithGoogleFirebase(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign in using Google Identity Services (GIS) ID Token Credential
 */
export async function loginWithGoogleCredentialToken(idToken: string): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
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
 * Helper to strip undefined values for Firebase compatibility
 */
function sanitizeForFirebase<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Save Gemini Keys Pool to Cloud Firestore & Realtime Database
 */
export async function saveCloudGeminiKeys(keys: any[], autoRotate: boolean = true, activeModel?: string): Promise<boolean> {
  const payload = sanitizeForFirebase({
    geminiKeys: keys,
    geminiAutoRotate: autoRotate,
    geminiModel: activeModel || 'gemini-3.0-flash',
    geminiUpdatedAt: new Date().toISOString(),
  });

  let rtdbSuccess = false;
  let firestoreSuccess = false;

  // Realtime Database
  try {
    const keyRef = rtdbRef(rtdb, 'gemini_pool/10a5');
    await rtdbSet(keyRef, payload);
    rtdbSuccess = true;
  } catch (err: any) {
    console.warn('[Firebase RTDB] Lỗi lưu Gemini Keys:', err?.message || err);
  }

  // Cloud Firestore (if quota allows)
  try {
    const docRef = doc(db, 'classes', '10a5');
    await setDoc(docRef, payload, { merge: true });
    firestoreSuccess = true;
  } catch (err: any) {
    console.warn('[Firebase Firestore] Lỗi lưu Gemini Keys:', err?.message || err);
  }

  return rtdbSuccess || firestoreSuccess;
}

/**
 * Fetch Gemini Keys Pool from Cloud Storage (RTDB first, fallback to Firestore)
 */
export async function fetchCloudGeminiKeys(): Promise<{ keys: any[]; autoRotate: boolean; activeModel?: string } | null> {
  // 1. Try Realtime Database
  try {
    const snap = await rtdbGet(rtdbRef(rtdb, 'gemini_pool/10a5'));
    if (snap.exists()) {
      const data = snap.val();
      if (data && Array.isArray(data.geminiKeys) && data.geminiKeys.length > 0) {
        return {
          keys: data.geminiKeys,
          autoRotate: data.geminiAutoRotate !== false,
          activeModel: data.geminiModel,
        };
      }
    }
  } catch (err) {
    console.warn('[Firebase RTDB] Lỗi đọc Gemini Keys:', err);
  }

  // 2. Fallback to Cloud Firestore
  try {
    const docRef = doc(db, 'classes', '10a5');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.geminiKeys)) {
        return {
          keys: data.geminiKeys,
          autoRotate: data.geminiAutoRotate !== false,
          activeModel: data.geminiModel,
        };
      }
    }
  } catch (err) {
    console.warn('[Firebase Firestore] Lỗi đọc Gemini Keys:', err);
  }
  return null;
}

/**
 * Listen to auth state changes
 */
export function onFirebaseAuthStateChanged(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Fetch full classroom state from Cloud (RTDB & Firestore with newest updatedAt)
 */
export async function fetchCloudClassState(): Promise<ClassroomFullState | null> {
  let rtdbData: ClassroomFullState | null = null;
  let firestoreData: ClassroomFullState | null = null;

  // 1. Fetch from Firebase Realtime Database
  try {
    const snap = await rtdbGet(rtdbRef(rtdb, 'classes/10a5'));
    if (snap.exists()) {
      const val = snap.val();
      if (val && Array.isArray(val.students) && val.students.length > 0) {
        rtdbData = val as ClassroomFullState;
      }
    }
  } catch (err: any) {
    console.warn('[Firebase RTDB] Lỗi đọc Realtime Database:', err?.message || err);
  }

  // 2. Fetch from Cloud Firestore
  try {
    const docRef = doc(db, 'classes', '10a5');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const val = snap.data();
      if (val && Array.isArray(val.students) && val.students.length > 0) {
        firestoreData = val as ClassroomFullState;
      }
    }
  } catch (err: any) {
    console.warn('[Firebase Firestore] Lỗi đọc Firestore:', err?.message || err);
  }

  // Return the one with the newest updatedAt timestamp
  if (rtdbData && firestoreData) {
    const rtdbTime = new Date(rtdbData.updatedAt || 0).getTime();
    const fsTime = new Date(firestoreData.updatedAt || 0).getTime();
    return rtdbTime >= fsTime ? rtdbData : firestoreData;
  }

  return rtdbData || firestoreData || null;
}

/**
 * Save full classroom state to Firebase Realtime Database & Cloud Firestore
 */
export async function saveCloudClassState(state: ClassroomFullState): Promise<boolean> {
  const cleanState = sanitizeForFirebase({
    ...state,
    updatedAt: state.updatedAt || new Date().toISOString(),
  });

  let rtdbSuccess = false;
  let firestoreSuccess = false;

  // 1. Primary write: Firebase Realtime Database (không bị quota 20k writes/ngày chặn)
  try {
    const classRef = rtdbRef(rtdb, 'classes/10a5');
    await rtdbSet(classRef, cleanState);
    rtdbSuccess = true;
  } catch (err: any) {
    console.warn('[Firebase RTDB] Lỗi ghi Realtime Database:', err?.message || err);
  }

  // 2. Secondary write: Cloud Firestore (nếu còn quota)
  try {
    const docRef = doc(db, 'classes', '10a5');
    await setDoc(docRef, cleanState, { merge: true });
    firestoreSuccess = true;
  } catch (err: any) {
    console.warn('[Firebase Firestore] Lỗi ghi Firestore (Spark quota hoặc network):', err?.message || err);
  }

  return rtdbSuccess || firestoreSuccess;
}

/**
 * Real-time listener for Cloud updates (RTDB onValue + Firestore onSnapshot)
 */
export function subscribeToCloudClassState(onUpdate: (state: ClassroomFullState) => void): () => void {
  let unsubRtdb = () => {};
  let unsubFs = () => {};

  // 1. RTDB listener
  try {
    const classRef = rtdbRef(rtdb, 'classes/10a5');
    unsubRtdb = rtdbOnValue(classRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val() as ClassroomFullState;
        if (data && Array.isArray(data.students) && data.students.length > 0) {
          onUpdate(data);
        }
      }
    }, (err) => {
      console.warn('[Firebase RTDB] Lỗi lắng nghe realtime:', err);
    });
  } catch (err) {
    console.warn('[Firebase RTDB] Kết nối realtime lỗi:', err);
  }

  // 2. Firestore listener
  try {
    const docRef = doc(db, 'classes', '10a5');
    unsubFs = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as ClassroomFullState;
        if (data && Array.isArray(data.students) && data.students.length > 0) {
          onUpdate(data);
        }
      }
    }, (error) => {
      // Ignored silently for quota exceeded
    });
  } catch (err) {
    // Ignored
  }

  return () => {
    unsubRtdb();
    unsubFs();
  };
}
