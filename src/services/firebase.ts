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
  getDatabase,
  ref as rtdbRef,
  set as rtdbSet,
  update as rtdbUpdate,
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

// Initialize Firebase App & Services (Realtime Database & Auth only — Firestore disabled to prevent quota errors)
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
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
 * Save Gemini Keys Pool to Firebase Realtime Database
 */
export async function saveCloudGeminiKeys(keys: any[], autoRotate: boolean = true, activeModel?: string): Promise<boolean> {
  const payload = sanitizeForFirebase({
    geminiKeys: keys,
    geminiAutoRotate: autoRotate,
    geminiModel: activeModel || 'gemini-3.0-flash',
    geminiUpdatedAt: new Date().toISOString(),
  });

  // 1. Primary: Realtime Database SDK
  try {
    const keyRef = rtdbRef(rtdb, 'gemini_pool/10a5');
    await rtdbSet(keyRef, payload);
    return true;
  } catch (err: any) {
    console.warn('[Firebase RTDB SDK] Lỗi lưu Gemini Keys, thử qua REST:', err?.message || err);
  }

  // 2. Fallback: Realtime Database REST
  try {
    const res = await fetch('https://thiduaa5-default-rtdb.firebaseio.com/gemini_pool/10a5.json', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err: any) {
    console.warn('[Firebase RTDB REST] Lỗi lưu Gemini Keys:', err?.message || err);
    return false;
  }
}

/**
 * Fetch Gemini Keys Pool from Firebase Realtime Database
 */
export async function fetchCloudGeminiKeys(): Promise<{ keys: any[]; autoRotate: boolean; activeModel?: string } | null> {
  // 1. Try Realtime Database SDK
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
    console.warn('[Firebase RTDB SDK] Lỗi đọc Gemini Keys, thử qua REST:', err);
  }

  // 2. Fallback to Realtime Database REST
  try {
    const res = await fetch('https://thiduaa5-default-rtdb.firebaseio.com/gemini_pool/10a5.json', {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.geminiKeys) && data.geminiKeys.length > 0) {
        return {
          keys: data.geminiKeys,
          autoRotate: data.geminiAutoRotate !== false,
          activeModel: data.geminiModel,
        };
      }
    }
  } catch (err) {
    console.warn('[Firebase RTDB REST] Lỗi đọc Gemini Keys:', err);
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
 * In-memory tracker of the last saved timestamp to suppress echo loops
 */
let lastSavedUpdatedAt = '';

/**
 * Fetch full classroom state from Cloud (RTDB REST primary, RTDB SDK fallback)
 */
export async function fetchCloudClassState(): Promise<ClassroomFullState | null> {
  // 1. Fetch from Firebase Realtime Database via REST (fastest, no socket handshake delays)
  try {
    const res = await fetch('https://thiduaa5-default-rtdb.firebaseio.com/classes/10a5.json', {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      const val = await res.json();
      if (val && Array.isArray(val.students) && val.students.length > 0) {
        return val as ClassroomFullState;
      }
    }
  } catch (err: any) {
    console.warn('[Firebase RTDB REST] Lỗi đọc qua REST:', err?.message || err);
  }

  // 2. Fallback to Firebase Realtime Database via SDK
  try {
    const snap = await rtdbGet(rtdbRef(rtdb, 'classes/10a5'));
    if (snap.exists()) {
      const val = snap.val();
      if (val && Array.isArray(val.students) && val.students.length > 0) {
        return val as ClassroomFullState;
      }
    }
  } catch (err: any) {
    console.warn('[Firebase RTDB SDK] Lỗi đọc Realtime Database:', err?.message || err);
  }

  return null;
}

/**
 * Save classroom state to Firebase Realtime Database using PATCH / update
 */
export async function saveCloudClassState(state: ClassroomFullState): Promise<boolean> {
  const updatedAt = state.updatedAt || new Date().toISOString();
  lastSavedUpdatedAt = updatedAt;

  const cleanState = sanitizeForFirebase({
    ...state,
    updatedAt,
  });

  // 1. Primary: Direct REST PUT to Firebase Realtime Database
  try {
    const res = await fetch('https://thiduaa5-default-rtdb.firebaseio.com/classes/10a5.json', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanState),
    });
    if (res.ok) {
      return true;
    }
  } catch (err: any) {
    console.warn('[Firebase RTDB REST] Lỗi ghi qua REST, chuyển sang SDK:', err?.message || err);
  }

  // 2. Fallback: Realtime Database SDK set
  try {
    const classRef = rtdbRef(rtdb, 'classes/10a5');
    await rtdbSet(classRef, cleanState);
    return true;
  } catch (err: any) {
    console.warn('[Firebase RTDB SDK] Lỗi ghi qua SDK:', err?.message || err);
    return false;
  }
}

/**
 * Lưu trữ bản sao lưu chuẩn Sơ đồ lớp (Canonical Seating Master) trên Firebase
 * để làm mốc quy chiếu vĩnh viễn, ngăn ngừa mọi trường hợp bị cập nhật đè làm mất.
 */
export async function saveCanonicalSeatingBackup(students: any[], layout: any[]): Promise<boolean> {
  const payload = sanitizeForFirebase({
    students,
    layout,
    backupCreatedAt: new Date().toISOString(),
    version: Date.now(),
    note: 'Bản lưu trữ chuẩn Sơ đồ lớp 10A5 (Canonical Master)',
  });

  try {
    const res = await fetch('https://thiduaa5-default-rtdb.firebaseio.com/classes/10a5_canonical_seating_backup.json', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      console.info('[Firebase] Đã lưu bản sao lưu chuẩn Sơ đồ lớp (Canonical Backup) thành công.');
      return true;
    }
  } catch (err: any) {
    console.warn('[Firebase] Lỗi lưu bản sao lưu chuẩn qua REST:', err);
  }

  try {
    const backupRef = rtdbRef(rtdb, 'classes/10a5_canonical_seating_backup');
    await rtdbSet(backupRef, payload);
    return true;
  } catch (err) {
    console.warn('[Firebase] Lỗi lưu bản sao lưu chuẩn qua SDK:', err);
    return false;
  }
}

let lastAppliedRemoteUpdatedAt = '';

/**
 * Real-time listener for Cloud updates (RTDB onValue without self-echo)
 */
export function subscribeToCloudClassState(onUpdate: (state: ClassroomFullState) => void): () => void {
  let unsubRtdb = () => {};

  try {
    const classRef = rtdbRef(rtdb, 'classes/10a5');
    unsubRtdb = rtdbOnValue(classRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val() as ClassroomFullState;
        if (data && Array.isArray(data.students) && data.students.length > 0) {
          // Bỏ qua echo nếu dữ liệu trùng với mốc vừa được lưu hoặc vừa áp dụng
          if (data.updatedAt && (data.updatedAt === lastSavedUpdatedAt || data.updatedAt === lastAppliedRemoteUpdatedAt)) {
            return;
          }
          if (data.updatedAt) {
            lastAppliedRemoteUpdatedAt = data.updatedAt;
          }
          onUpdate(data);
        }
      }
    }, (err) => {
      console.warn('[Firebase RTDB] Lỗi lắng nghe realtime:', err);
    });
  } catch (err) {
    console.warn('[Firebase RTDB] Kết nối realtime lỗi:', err);
  }

  return () => {
    unsubRtdb();
  };
}
