import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBaTbi1991gm29Mkg8fF7SzrhwmR35Lg6o",
    authDomain: "bus-connect-1b577.firebaseapp.com",
    projectId: "bus-connect-1b577",
    storageBucket: "bus-connect-1b577.appspot.com",
    messagingSenderId: "389708422203",
    appId: "1:389708422203:web:910ce222b141a55e6c501e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// DOM Elements
const fromInput = document.getElementById('from');
const destinationInput = document.getElementById('destination');
const searchBtn = document.getElementById('search-btn');
const resultsSection = document.getElementById('results-section');
const busResults = document.getElementById('bus-results');
const loadingIndicator = document.getElementById('loading');
const noBusesMessage = document.getElementById('no-buses');

// Search buses by route
async function searchBuses() {
    const from = fromInput.value.trim().toLowerCase();
    const destination = destinationInput.value.trim().toLowerCase();
    
    if (!from || !destination) {
        alert("Please enter both starting point and destination");
        return;
    }

    try {
        // Show loading state
        busResults.innerHTML = '';
        resultsSection.classList.remove('hidden');
        loadingIndicator.classList.remove('hidden');
        noBusesMessage.classList.add('hidden');

        // Query Firestore for buses that include both locations in their route
        const busRoutesRef = collection(db, "busRoutes");
        const querySnapshot = await getDocs(busRoutesRef);

        // Hide loading indicator
        loadingIndicator.classList.add('hidden');

        const matchingBuses = [];
        
        querySnapshot.forEach((doc) => {
            const busData = doc.data();
            const routePath = busData.routePath?.map(loc => loc.toLowerCase()) || [];
            
            const fromIndex = routePath.indexOf(from);
            const destIndex = routePath.indexOf(destination);
            
            // Check if both locations exist and are in correct order
            if (fromIndex !== -1 && destIndex !== -1 && fromIndex < destIndex) {
                matchingBuses.push({
                    id: doc.id,
                    ...busData
                });
            }
        });

        if (matchingBuses.length === 0) {
            noBusesMessage.classList.remove('hidden');
            return;
        }

        // Display matching buses
        matchingBuses.forEach(bus => {
            const busItem = document.createElement('li');
            busItem.className = 'bg-white p-4 rounded-lg shadow-md';
            
            busItem.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-lg font-bold text-gray-900">${bus.busNumber || 'Bus ' + bus.id}</h3>
                        <p class="text-sm text-gray-600 mt-1">
                            <span class="font-medium">Operator:</span> ${bus.operatorName || 'Unknown'}
                        </p>
                        <div class="mt-2">
                            <p class="text-sm text-gray-700">
                                <span class="font-medium">Route:</span> ${bus.routePath?.join(' → ') || 'Not specified'}
                            </p>
                            <p class="text-sm text-gray-700 mt-1">
                                <span class="font-medium">Departure:</span> ${bus.departureTime || 'N/A'}
                            </p>
                        </div>
                    </div>
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium 
                        ${bus.status === 'Active' ? 'bg-green-100 text-green-800' : 
                          bus.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'}">
                        ${bus.status || 'Unknown'}
                    </span>
                </div>
                <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div class="bg-blue-50 p-2 rounded">
                        <span class="font-medium text-blue-700">Fare:</span> ${bus.fare ? '₹' + bus.fare : 'N/A'}
                    </div>
                    <div class="bg-purple-50 p-2 rounded">
                        <span class="font-medium text-purple-700">Capacity:</span> ${bus.capacity || 'N/A'}
                    </div>
                </div>
            `;
            busResults.appendChild(busItem);
        });

    } catch (error) {
        console.error("Error searching buses:", error);
        loadingIndicator.classList.add('hidden');
        alert("Failed to search for buses. Please try again.");
    }
}

// Event Listeners
searchBtn.addEventListener('click', searchBuses);

// Operator login function (unchanged)
async function login(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("User logged in:", userCredential.user);
        window.location.href = "operator.html";
    } catch (error) {
        alert("Login failed: " + error.message);
    }
}