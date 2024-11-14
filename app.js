import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDocs, deleteDoc } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';
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

// Variables
let currentUserName = '';
let showScores = false; // Track whether scores are visible

// Start voting after user enters their name
startVotingButton.addEventListener('click', () => {
  currentUserName = userNameInput.value.trim();
  if (!currentUserName) {
    alert("Please enter a name.");
    return;
  }
  alert(`Welcome ${currentUserName}! You can now vote.`);
  startVotingButton.style.display = 'none'; // Hide the start button
  toggleScoresButton.style.display = 'inline'; // Show the "Show Scores" button
});

// Handle card clicks (voting)
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

    // Update the current work item display
    workItemDisplay.textContent = workItemId;

    // Add vote to Firestore
    try {
      await addDoc(collection(db, 'votes'), {
        workItemId: workItemId,
        vote: voteValue,
        user: currentUserName,
        timestamp: serverTimestamp() // Timestamp for sorting
      });
      console.log("Vote added to Firestore.");
    } catch (error) {
      console.error("Error adding vote: ", error);
    }
  });
});

// Real-time listener for votes
const votesQuery = query(collection(db, 'votes'), orderBy('timestamp'));
onSnapshot(votesQuery, snapshot => {
  renderVoteHistory(snapshot);
});

// Function to render the vote table
function renderVoteHistory(snapshot) {
  // Clear current table
  voteHistoryTable.innerHTML = '';

  // Add each vote to the table
  snapshot.forEach(doc => {
    const voteData = doc.data();
    const row = document.createElement('tr');

    const workItemCell = document.createElement('td');
    const nameCell = document.createElement('td');
    const voteCell = document.createElement('td');

    workItemCell.textContent = voteData.workItemId;
    nameCell.textContent = voteData.user;

    // Show or hide votes based on `showScores`
    voteCell.textContent = showScores ? voteData.vote : 'Hidden';

    row.appendChild(workItemCell);
    row.appendChild(nameCell);
    row.appendChild(voteCell);
    voteHistoryTable.appendChild(row);
  });
}

// Toggle score visibility
toggleScoresButton.addEventListener('click', () => {
  showScores = !showScores;
  toggleScoresButton.textContent = showScores ? 'Hide Scores' : 'Show Scores';

  // Manually re-render the table to reflect the change
  const votesQuery = query(collection(db, 'votes'), orderBy('timestamp'));
  onSnapshot(votesQuery, snapshot => {
    renderVoteHistory(snapshot);
  });
});

// Function to clear votes
async function clearVotes() {
  try {
    // Retrieve all votes from Firestore and delete them
    const votesSnapshot = await getDocs(collection(db, 'votes'));
    votesSnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref); // Delete each vote
    });
    console.log("All votes cleared from Firestore.");
  } catch (error) {
    console.error("Error clearing votes: ", error);
  }
}

// Add the clear button event listener
const clearVotesButton = document.getElementById('clear-votes');
clearVotesButton.addEventListener('click', clearVotes);

// References to Winner Section Elements
const winnerForm = document.getElementById('winner-form');
const winnerTableBody = document.querySelector('#winner-table tbody');

// Firestore reference for the "MNWINNERS" collection
const winnersCollection = collection(db, 'MNWINNERS');

// Listen for Winner Form Submission
winnerForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // Prevent form from reloading the page

  // Get input values
  const date = document.getElementById('winner-date').value;
  const workItem = document.getElementById('winner-work-item').value;
  const score = document.getElementById('winner-score').value;

  // Validate inputs
  if (!date || !workItem || !score) {
    alert('Please fill out all fields!');
    return;
  }

  // Save the winner data to Firebase
  try {
    await addDoc(winnersCollection, {
      date,
      workItem,
      score,
      timestamp: serverTimestamp(), // For ordering
    });

    // Update the table locally after submission
    addWinnerToTable(date, workItem, score);

    // Clear the form
    winnerForm.reset();
  } catch (e) {
    console.error('Error saving winner:', e);
    alert('Error saving winner. Please try again.');
  }
});

// Function to Add Winner Data to the Table
function addWinnerToTable(date, workItem, score) {
  const newRow = document.createElement('tr');
  newRow.innerHTML = `
    <td>${date}</td>
    <td>${workItem}</td>
    <td>${score}</td>
  `;
  winnerTableBody.appendChild(newRow);
}

// Load Winner Data from Firebase on Page Load
async function loadWinners() {
  try {
    const querySnapshot = await getDocs(query(winnersCollection, orderBy('timestamp')));
    querySnapshot.forEach((doc) => {
      const winner = doc.data();
      addWinnerToTable(winner.date, winner.workItem, winner.score);
    });
  } catch (e) {
    console.error('Error loading winners:', e);
  }
}

// Load winners when the page loads
loadWinners();
