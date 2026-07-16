// ============================================================
// FIREBASE CONFIGURATION
// Replace the placeholder values below with your own config
// from Firebase Console → Project Settings → Your Apps → Web
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyCH4kMcp5GtaJOyi3Wiya_GJ6MEPILFifo",
    authDomain: "whelmen-1d58d.firebaseapp.com",
    projectId: "whelmen-1d58d",
    storageBucket: "whelmen-1d58d.firebasestorage.app",
    messagingSenderId: "362424274644",
    appId: "1:362424274644:web:dd2317b5dfffbcd597b541",
    measurementId: "G-C9GM5QPR0B"
};

// Initialize Firebase (uses global firebase loaded via CDN in index.html)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ============================================================
// PLAYER IDENTITY
// ============================================================
export function getPlayerId() {
    let id = localStorage.getItem('whelmen_player_id');
    if (!id) {
        id = 'p_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
        localStorage.setItem('whelmen_player_id', id);
    }
    return id;
}

// ============================================================
// LOBBY CODE GENERATOR
// ============================================================
const LOBBY_WORDS = [
    'BLAZE', 'STORM', 'TIDE', 'STONE', 'EMBER', 'GALE',
    'WAVE', 'QUAKE', 'FROST', 'DUST', 'FLAME', 'CREEK',
    'BOLT', 'PEAK', 'MIST', 'VALE', 'PYRE', 'GUST'
];

function generateLobbyCode() {
    const w1 = LOBBY_WORDS[Math.floor(Math.random() * LOBBY_WORDS.length)];
    const w2 = LOBBY_WORDS[Math.floor(Math.random() * LOBBY_WORDS.length)];
    const num = Math.floor(Math.random() * 100);
    return `${w1}-${w2}-${num}`;
}

// ============================================================
// LOBBY MANAGEMENT
// ============================================================
export async function createLobby(hostId) {
    const code = generateLobbyCode();
    const ref = db.ref(`lobbies/${code}`);

    // Check for collision (extremely unlikely but safe)
    const existing = await ref.once('value');
    if (existing.exists()) {
        return createLobby(hostId); // Retry with new code
    }

    await ref.set({
        hostId: hostId,
        players: {
            [hostId]: { role: 'host' }
        },
        status: 'waiting',
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        gameState: null,
        lastActionBy: null
    });

    // Auto-cleanup lobby if host disconnects while waiting
    ref.child('status').onDisconnect().set('abandoned');

    return code;
}

export async function joinLobby(code, guestId) {
    const ref = db.ref(`lobbies/${code}`);
    const snapshot = await ref.once('value');

    if (!snapshot.exists()) {
        throw new Error('Lobby not found. Check the code and try again.');
    }

    const data = snapshot.val();

    if (data.status === 'abandoned' || data.status === 'finished') {
        throw new Error('This lobby is no longer active.');
    }
    if (data.status !== 'waiting') {
        throw new Error('This lobby already has a game in progress.');
    }
    
    if (!data.players) data.players = {};
    if (Object.keys(data.players).length >= 4) {
        throw new Error('This lobby is already full.');
    }
    if (data.players[guestId]) {
        throw new Error('You are already in this lobby.');
    }

    data.players[guestId] = { role: `guest${Object.keys(data.players).length}` };

    await ref.update({
        players: data.players
        // Note: we don't set status to ready immediately, host starts the game
    });

    return data;
}

export function listenToLobby(code, callback) {
    const ref = db.ref(`lobbies/${code}`);
    const handler = (snapshot) => {
        callback(snapshot.val());
    };
    ref.on('value', handler);

    // Return unsubscribe function
    return () => ref.off('value', handler);
}

// ============================================================
// GAME STATE SYNC
// ============================================================
export async function writeGameState(code, gameState, lastActionBy) {
    const ref = db.ref(`lobbies/${code}`);
    await ref.update({
        gameState: gameState,
        lastActionBy: lastActionBy,
        status: 'playing'
    });
}

export function listenToGameState(code, callback) {
    const ref = db.ref(`lobbies/${code}`);
    const handler = (snapshot) => {
        const val = snapshot.val();
        if (val) {
            callback(val.gameState, val.lastActionBy, val.status);
        }
    };
    ref.on('value', handler);

    return () => ref.off('value', handler);
}

// ============================================================
// LOBBY CLEANUP
// ============================================================
export async function setLobbyStatus(code, status) {
    await db.ref(`lobbies/${code}/status`).set(status);
}

export async function startLobbyGame(code) {
    await db.ref(`lobbies/${code}/status`).set('ready');
}

export async function deleteLobby(code) {
    await db.ref(`lobbies/${code}`).remove();
}

export { db };
