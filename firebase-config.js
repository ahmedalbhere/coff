// تكوين Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCEiLtGdPkBjjEWLykI3tJ14pssGieNs9Q",
  authDomain: "coffee-dda5d.firebaseapp.com",
  databaseURL: "https://coffee-dda5d-default-rtdb.firebaseio.com",
  projectId: "coffee-dda5d",
  storageBucket: "coffee-dda5d.appspot.com",
  messagingSenderId: "249745795567",
  appId: "1:249745795567:web:fa59764cf4ec1d50e36e1a",
  measurementId: "G-JW3975C92K"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();
