    import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
    import {
      getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
    } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
    import {
      getFirestore, doc, getDoc, setDoc
    } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

    // ---- 1. Fill this in with your own Firebase project config ----
    const firebaseConfig = {
      apiKey: 'AIzaSyDl2HNDI-WQTIAN5ouJCLwwDwEV_W6wYEk',
      authDomain: 'lab-calc-app-77c0a.firebaseapp.com',
      projectId: 'lab-calc-app-77c0a',
      storageBucket: 'lab-calc-app-77c0a.firebasestorage.app',
      messagingSenderId: '335546266611',
      appId: '1:335546266611:web:e4a6ddfd558e73b97cd886'
    };
    const isConfigured = !Object.values(firebaseConfig).some(v => String(v).startsWith('YOUR_'));

    const statusEl = document.getElementById('sync-status');
    const authBtn = document.getElementById('auth-btn');
    const signOutBtn = document.getElementById('signout-btn');

    function setStatus(text, mode) {
      if (!statusEl) return;
      statusEl.textContent = text;
      statusEl.className = 'sync-status' + (mode ? ' ' + mode : '');
    }

    if (!isConfigured) {
      // No project configured yet — keep the button visible as a hint, but make
      // it a no-op instead of throwing, so the rest of the app is unaffected.
      setStatus('', '');
      authBtn.title = 'Cloud sync not configured — see firebaseConfig in index.html';
      authBtn.textContent = '⇥';
      window.handleAuthClick = () => {
        alert('Cloud sync isn\'t set up yet.\n\nAdd your Firebase project config to the firebaseConfig object near the bottom of index.html to enable Google sign-in and cross-device sync.');
      };
      window.handleSignOutClick = () => {};
    } else {
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const db = getFirestore(app);
      const provider = new GoogleAuthProvider();

      let currentUser = null;
      let saveTimer = null;
      let applyingRemoteUpdate = false; // guards against re-saving what we just loaded

      function protocolDocRef(uid) {
        return doc(db, 'users', uid, 'data', 'protocols');
      }
      function homeDocRef(uid) {
        return doc(db, 'users', uid, 'data', 'home');
      }

      window.handleAuthClick = async function () {
        if (currentUser) return; // identity display only once signed in — use the dedicated Sign out button
        try {
          setStatus('Signing in…', 'syncing');
          await signInWithPopup(auth, provider);
        } catch (err) {
          console.error('Sign-in failed', err);
          setStatus('Sign-in failed', 'offline');
        }
      };

      window.handleSignOutClick = async function () {
        if (!currentUser) return;
        if (!confirm('Sign out of cloud sync? Your protocols stay saved to your account, but this device will stop syncing until you sign in again.')) return;
        await signOut(auth);
      };

      onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        if (!user) {
          setStatus('Not signed in — saved on this device only', '');
          authBtn.textContent = '⇥';
          authBtn.style.background = '';
          authBtn.title = 'Sign in with Google';
          authBtn.querySelector('img')?.remove();
          signOutBtn.hidden = true;
          return;
        }

        // Show the user's Google avatar on the profile button if available.
        authBtn.textContent = '';
        authBtn.querySelectorAll('img').forEach(el => el.remove());
        if (user.photoURL) {
          const img = document.createElement('img');
          img.src = user.photoURL;
          img.alt = user.displayName || 'Signed in';
          authBtn.appendChild(img);
        } else {
          authBtn.textContent = (user.displayName || user.email || '?').slice(0, 2).toUpperCase();
        }
        authBtn.title = 'Signed in as ' + (user.displayName || user.email);
        signOutBtn.hidden = false;

        setStatus('Syncing…', 'syncing');
        try {
          const [protoSnap, homeSnap] = await Promise.all([
            getDoc(protocolDocRef(user.uid)),
            getDoc(homeDocRef(user.uid))
          ]);
          applyingRemoteUpdate = true;
          if (protoSnap.exists() && Array.isArray(protoSnap.data().protocols)) {
            window.replaceAllProtocols(protoSnap.data().protocols);
          } else {
            // First sign-in on this account: push whatever is currently on this
            // device up as the starting cloud copy, rather than wiping it.
            await setDoc(protocolDocRef(user.uid), { protocols: window.getCurrentProtocols ? window.getCurrentProtocols() : [] });
          }
          if (homeSnap.exists()) {
            window.replaceHomeData(homeSnap.data());
          } else {
            await setDoc(homeDocRef(user.uid), window.getCurrentHomeData ? window.getCurrentHomeData() : { notes: '', tasks: [] });
          }
          applyingRemoteUpdate = false;
          setStatus('Synced', 'synced');
        } catch (err) {
          applyingRemoteUpdate = false;
          console.error('Cloud load failed', err);
          setStatus('Sync error — working offline', 'offline');
        }
      });

      // Called by renderProtocolLists() in the main script every time the
      // protocols array changes. Debounced so rapid edits (checking several
      // steps quickly, etc.) don't fire a write per keystroke/click.
      window.onProtocolsChanged = function (protocols) {
        if (!currentUser || applyingRemoteUpdate) return;
        setStatus('Saving…', 'syncing');
        clearTimeout(saveTimer);
        saveTimer = setTimeout(async () => {
          try {
            await setDoc(protocolDocRef(currentUser.uid), { protocols });
            setStatus('Synced', 'synced');
          } catch (err) {
            console.error('Cloud save failed', err);
            setStatus('Sync error — changes kept locally', 'offline');
          }
        }, 800);
      };

      // Same pattern as above, but for the home screen's quick notes + tasks.
      // Uses its own debounce timer so notes-typing and protocol edits don't
      // reset each other's pending save.
      let homeSaveTimer = null;
      window.onHomeDataChanged = function (homeData) {
        if (!currentUser || applyingRemoteUpdate) return;
        setStatus('Saving…', 'syncing');
        clearTimeout(homeSaveTimer);
        homeSaveTimer = setTimeout(async () => {
          try {
            await setDoc(homeDocRef(currentUser.uid), homeData);
            setStatus('Synced', 'synced');
          } catch (err) {
            console.error('Cloud save failed', err);
            setStatus('Sync error — changes kept locally', 'offline');
          }
        }, 800);
      };

      setStatus('Not signed in — saved on this device only', '');
    }
