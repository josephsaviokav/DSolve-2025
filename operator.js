import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

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
const operatorIdInput = document.getElementById('operator-id');
const submitBtn = document.getElementById('submit');
const busListSection = document.getElementById('bus-list');
const busContainer = document.getElementById('bus-container');
const noBusesMessage = document.getElementById('no-buses');
const loadingIndicator = document.getElementById('loading');
const refreshBtn = document.getElementById('refresh-btn');
const logoutBtn = document.getElementById('logout-btn');
const locationSection = document.getElementById('location-section');
const updateLocationBtn = document.getElementById('update-location');
const locationStatus = document.getElementById('location-status');
const locationDetails = document.getElementById('location-details');
const latitudeElement = document.getElementById('latitude');
const longitudeElement = document.getElementById('longitude');
const locationAddressElement = document.getElementById('location-address');

// Check if user is logged in
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is logged in
        logoutBtn.classList.remove('hidden');
        // Display operator ID if available
        if (user.email) {
            operatorIdInput.value = user.email.split('@')[0]; // Auto-fill operator ID if possible
        }
    } else {
        // User is not logged in, redirect to login
        window.location.href = 'login.html';
    }
});

// Logout functionality
logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error("Logout error:", error);
        Swal.fire({
            icon: 'error',
            title: 'Logout Failed',
            text: error.message,
        });
    });
});

async function fetchDocumentById(operatorId) {
    try {
        // Reference the document in the "busRoutes" collection
        const docRef = doc(db, "busRoutes", operatorId); // Replace "busRoutes" with your collection name
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            // Document data
            console.log(`Document ID: ${docSnap.id}`, docSnap.data());
            return docSnap.data();
        } else {
            // Document does not exist
            console.log("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching document:", error);
        return null;
    }
}

// Get assigned buses for operator with enhanced route display
async function getAssignedBuses() {
    const operatorId = operatorIdInput.value.trim();
    
    if (!operatorId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Please enter an Operator ID',
        });
        return;
    }

    try {
        // Show loading state
        busContainer.innerHTML = '';
        busListSection.classList.remove('hidden');
        loadingIndicator.classList.remove('hidden');
        noBusesMessage.classList.add('hidden');

        // Query Firestore for buses assigned to this operator
        const busRoutesRef = collection(db, "busRoutes");
        const q = query(busRoutesRef, where("operatorId", "==", operatorId));
        const querySnapshot = await getDocs(q);

        // Hide loading indicator
        loadingIndicator.classList.add('hidden');

        if (querySnapshot.empty) {
            noBusesMessage.classList.remove('hidden');
            return;
        }

        // Process and display the buses with enhanced route visualization
        querySnapshot.forEach((doc) => {
            const busData = doc.data();
            const busItem = document.createElement('li');
            busItem.className = 'py-4 px-4 bg-gray-50 rounded-lg mb-4 shadow-sm hover:shadow-md transition-shadow';
            
            // Create a visual route path
            const routePath = busData.routePath || [];
            const routeStops = routePath.map((stop, index) => `
                <div class="flex items-center">
                    <div class="flex flex-col items-center mr-2">
                        <div class="w-3 h-3 rounded-full ${index === 0 ? 'bg-green-500' : index === routePath.length - 1 ? 'bg-red-500' : 'bg-blue-500'}"></div>
                        ${index < routePath.length - 1 ? `<div class="w-0.5 h-6 bg-gray-300"></div>` : ''}
                    </div>
                    <span class="text-sm ${index === 0 ? 'font-bold text-green-700' : index === routePath.length - 1 ? 'font-bold text-red-700' : 'text-gray-700'}">${stop}</span>
                </div>
            `).join('');

            busItem.innerHTML = `
                <div class="flex flex-col space-y-3">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="text-lg font-bold text-gray-900">${busData.busNumber || 'Bus ' + doc.id}</h3>
                            <p class="text-sm text-gray-500">
                                <span class="font-medium">Operator ID:</span> ${operatorId}
                            </p>
                        </div>
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium 
                            ${busData.status === 'Active' ? 'bg-green-100 text-green-800' : 
                              busData.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-gray-100 text-gray-800'}">
                            ${busData.status || 'Unknown'}
                        </span>
                    </div>

                    <div class="mt-2">
                        <h4 class="text-sm font-semibold text-gray-700 mb-1">Route Path:</h4>
                        <div class="flex flex-col space-y-1 pl-2">
                            ${routePath.length > 0 ? routeStops : '<p class="text-sm text-gray-500 italic">No route specified</p>'}
                        </div>
                    </div>

                    <div class="grid grid-cols-3 gap-2 text-sm mt-2">
                        <div class="bg-blue-50 p-2 rounded">
                            <span class="font-medium text-blue-700">Capacity:</span>
                            <span> ${busData.capacity || 'N/A'}</span>
                        </div>
                        <div class="bg-purple-50 p-2 rounded">
                            <span class="font-medium text-purple-700">Fare:</span>
                            <span> ${busData.fare ? '₹' + busData.fare : 'N/A'}</span>
                        </div>
                        <div class="bg-green-50 p-2 rounded">
                            <span class="font-medium text-green-700">Schedule:</span>
                            <span> ${busData.schedule || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            `;
            busContainer.appendChild(busItem);
        });

    } catch (error) {
        console.error("Error fetching buses:", error);
        loadingIndicator.classList.add('hidden');
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to fetch bus information. Please try again.',
        });
    }
}

// Get current location
async function updateLocation() {
    try {
        locationStatus.innerHTML = `
            <span class="relative flex h-3 w-3 mr-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            <span>Getting location...</span>
        `;
        
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const { latitude, longitude } = position.coords;
        latitudeElement.textContent = latitude.toFixed(6);
        longitudeElement.textContent = longitude.toFixed(6);
        
        // Try to get address from coordinates
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await response.json();
            locationAddressElement.textContent = data.display_name || "Address not available";
        } catch (e) {
            console.error("Error getting address:", e);
            locationAddressElement.textContent = "Address resolution failed";
        }

        locationStatus.innerHTML = `
            <span class="relative flex h-3 w-3 mr-2">
                <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span>Location available</span>
        `;
        
        locationDetails.classList.remove('hidden');
        
    } catch (error) {
        console.error("Error getting location:", error);
        locationStatus.innerHTML = `
            <span class="relative flex h-3 w-3 mr-2">
                <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span>Location error: ${error.message}</span>
        `;
    }
}

// Event Listeners
submitBtn.addEventListener('click', getAssignedBuses);
refreshBtn.addEventListener('click', getAssignedBuses);
updateLocationBtn.addEventListener('click', updateLocation);

// Show location section if the operator has buses
busContainer.addEventListener('DOMSubtreeModified', () => {
    if (busContainer.children.length > 0) {
        locationSection.classList.remove('hidden');
    } else {
        locationSection.classList.add('hidden');
    }
});

// Initialize location section if geolocation is available
if ('geolocation' in navigator) {
    updateLocationBtn.disabled = false;
} else {
    updateLocationBtn.disabled = true;
    locationStatus.innerHTML = `
        <span class="relative flex h-3 w-3 mr-2">
            <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
        <span>Geolocation not supported</span>
    `;
}