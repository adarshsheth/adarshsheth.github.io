/* ─────────────────────────────────────────────
   AUTH — Firebase Google login for dashboard
   Only adarshsheth@gmail.com (or your Google account) can log in.
   ───────────────────────────────────────────── */

// Firebase config — Adarsh: replace with your project's config
// Get this from Firebase Console > Project Settings > General
const firebaseConfig = {
	apiKey: "AIzaSyD5vUNBaYREQNgPVy_1yPdmTjxYJJ-KCiY",
	authDomain: "adarsh-portfolio-bcd3e.firebaseapp.com",
	projectId: "adarsh-portfolio-bcd3e",
	appId: "1:979300925347:web:7242c2a7d7f85af1176416",
};

// Authorized email — only this Google account can access the dashboard
const AUTHORIZED_EMAIL = "aadisheth2000@gmail.com";
window.AUTHORIZED_EMAIL = AUTHORIZED_EMAIL;

// Initialize Firebase
let auth = null;
try {
  firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
} catch (e) {
  console.warn('Firebase not configured yet. See FIREBASE_SETUP.md');
}

/* ── Auth state ── */
let currentUser = null;

function initAuth() {
  if (!auth) return;
  
  auth.onAuthStateChanged((user) => {
    if (user && user.email === AUTHORIZED_EMAIL) {
      currentUser = user;
      onLogin(user);
    } else {
      if (user) {
        // Wrong account — sign out immediately
        auth.signOut();
        alert('This dashboard is private. Please use the authorized Google account.');
      }
      currentUser = null;
      onLogout();
    }
  });
}

function signInWithGoogle() {
  if (!auth) {
    alert('Firebase not configured. See FIREBASE_SETUP.md');
    return;
  }
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch((err) => {
    console.error('Login failed:', err);
    alert('Login failed: ' + err.message);
  });
}

function signOut() {
  if (auth) auth.signOut();
}

/* ── UI updates ── */
function onLogin(user) {
  document.body.classList.add('logged-in');
  // Update login button
  const btn = document.getElementById('login-btn');
  if (btn) {
    btn.innerHTML = `<img src="${user.photoURL}" alt="" style="width:24px;height:24px;border-radius:50%;"> ${user.displayName.split(' ')[0]}`;
    btn.onclick = signOut;
    btn.title = 'Click to sign out';
  }
  // Show Apps Hub link
  document.querySelectorAll('.apps-hub-link').forEach(el => {
    el.style.display = '';
  });
  // Show private resume by default
  if (typeof showPrivateResume === 'function') showPrivateResume();
  // Load draft blog posts
  if (typeof loadDraftPosts === 'function') loadDraftPosts();
}

function onLogout() {
  document.body.classList.remove('logged-in');
  const btn = document.getElementById('login-btn');
  if (btn) {
    btn.innerHTML = '🔒 Login';
    btn.onclick = signInWithGoogle;
    btn.title = 'Sign in with Google';
  }
  document.querySelectorAll('.apps-hub-link').forEach(el => {
    el.style.display = 'none';
  });
  // Show public resume
  if (typeof showPublicResume === 'function') showPublicResume();
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}
