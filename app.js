import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { getFirestore, collection, query, orderBy, onSnapshot, serverTimestamp, getDocs, deleteDoc, setDoc, doc } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDTIuVn8IBPtAHfIL5AiSPtjw1ynFnais8",
  authDomain: "scrum-poker-board-1fdfb.firebaseapp.com",
  projectId: "scrum-poker-board-1fdfb",
  storageBucket: "scrum-poker-board-1fdfb.firebasestorage.app",
  messagingSenderId: "352702822956",
  appId: "1:352702822956:web:2185599557476d68c36f89",
  measurementId: "G-JL3HC47F5Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Sign in anonymously
signInAnonymously(auth)
  .then(() => {
    console.log('Signed in anonymously');
  })
  .catch((error) => {
    console.error('Error signing in:', error);
  });

// DOM elements
const cards = document.querySelectorAll('.card');
const workItemInput = document.getElementById('work-item');
const workItemDisplay = document.getElementById('work-item-display');
const voteHistoryTable = document.getElementById('vote-history').getElementsByTagName('tbody')[0];
const userNameInput = document.getElementById('user-name');
const startVotingButton = document.getElementById('start-voting');
const toggleScoresButton = document.getElementById('toggle-scores');
const clearVotesButton = document.getElementById('clear-votes');

// Variables
let currentUserName = '';
let showScores = false;

// Start voting after entering name
startVotingButton.addEventListener('click', () => {
  currentUserName = userNameInput.value.trim();
  if (!currentUserName) {
    alert("Please enter a name.");
    return;
  }
  alert(`Welcome ${currentUserName}! You can now vote.`);
  startVotingButton.style.display = 'none';
  toggleScoresButton.style.display = 'inline';
});

// Handle voting
cards.forEach(card => {
  card.addEventListener('click', async () => {
    if (!currentUserName) {
      alert("Please enter your name first.");
      return;
    }

    const voteValue = card.getAttribute('data-value');
    const workItemId = workItemInput.value.trim();

    if (!workItemId) {
      alert("Please enter a work item ID.");
      return;
    }

    workItemDisplay.textContent = workItemId;

    try {
      await setDoc(doc(db, 'CLVotes', currentUserName), {
        workItemId,
        vote: voteValue,
        user: currentUserName,
        timestamp: serverTimestamp()
      });
      console.log("Vote updated in Firestore.");
    } catch (error) {
      console.error("Error updating vote: ", error);
    }
  });
});

// Real-time listener
const votesQuery = query(collection(db, 'CLVotes'), orderBy('timestamp'));
onSnapshot(votesQuery, snapshot => {
  renderVoteHistory(snapshot);
});

// Render vote table
function renderVoteHistory(snapshot) {
  voteHistoryTable.innerHTML = '';
  snapshot.forEach(doc => {
    const voteData = doc.data();
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${voteData.workItemId}</td>
      <td>${voteData.user}</td>
      <td>${showScores ? voteData.vote : 'Hidden'}</td>
    `;
    voteHistoryTable.appendChild(row);
  });
}

// Toggle score visibility
toggleScoresButton.addEventListener('click', () => {
  showScores = !showScores;
  toggleScoresButton.textContent = showScores ? 'Hide Scores' : 'Show Scores';
  getDocs(votesQuery).then(snapshot => renderVoteHistory(snapshot));
});

// Clear votes
clearVotesButton.addEventListener('click', async () => {
  try {
    const votesSnapshot = await getDocs(collection(db, 'CLVotes'));
    votesSnapshot.forEach(async doc => await deleteDoc(doc.ref));
    console.log("All votes cleared.");
  } catch (error) {
    console.error("Error clearing votes: ", error);
  }
});
