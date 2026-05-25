// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBS_KFq-QLD89xyq1kTE3FJ62E8HFP09BI",
  authDomain: "rofriends-ab0b8.firebaseapp.com",
  projectId: "rofriends-ab0b8",
  storageBucket: "rofriends-ab0b8.firebasestorage.app",
  messagingSenderId: "309137703504",
  appId: "1:309137703504:web:ee535debe2c015630ec755",
  measurementId: "G-XQVQGYBL0X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Constants
const RONIN_CHAIN_ID = "0x7e4";

// Helper function
function truncateAddress(address) {
  if (!address) return "";
  return address.substring(0, 6) + "..." + address.substring(address.length - 4);
}

// Connect Wallet
async function connectRoninWallet() {
  const btn = document.getElementById("connectBtn");
  const walletAddressEl = document.getElementById("walletAddress");
  const disconnectBtn = document.getElementById("disconnectBtn");

  if (typeof window.ronin === "undefined" || !window.ronin.provider) {
    alert("Ronin Wallet not detected. Please install the Ronin Wallet extension.");
    window.open("https://wallet.roninchain.com/", "_blank");
    return;
  }

  try {
    btn.innerHTML = "Connecting...";
    btn.disabled = true;

    const provider = window.ronin.provider;

    // Request accounts
    const accounts = await provider.request({ method: "eth_requestAccounts" });
    const wallet = accounts[0];

    if (!wallet) throw new Error("No account returned");

    // Check and switch network if needed
    let chainId = await provider.request({ method: "eth_chainId" });

    if (chainId.toLowerCase() !== RONIN_CHAIN_ID.toLowerCase()) {
      const switchConfirmed = confirm(
        "You are not on the Ronin Network.\n\nWould you like to switch now?"
      );

      if (!switchConfirmed) {
        alert("Please switch to Ronin Network to continue.");
        return;
      }

      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: RONIN_CHAIN_ID }]
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          alert("Ronin Network is not added to your wallet. Please add it manually.");
        } else {
          alert("Failed to switch network.");
        }
        return;
      }
    }

    // Save to Firestore
    await setDoc(doc(db, "users", wallet.toLowerCase()), {
      wallet: wallet,
      network: "Ronin Mainnet",
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    }, { merge: true }); // Use merge to avoid overwriting existing data

    console.log("✅ User saved to Firestore");

    // Save to localStorage
    localStorage.setItem("roninWallet", wallet);

    // Update UI
    updateWalletUI(wallet);

    disconnectBtn.style.display = "inline-block";

  } catch (error) {
    console.error("Connection error:", error);

    if (error.code === 4001) {
      alert("Connection rejected by user.");
    } else if (error.code === -32603) {
      alert("Internal JSON-RPC error. Please try again.");
    } else {
      alert("Failed to connect to Ronin Wallet.");
    }
  } finally {
    btn.innerHTML = "Sign in using Ronin Wallet";
    btn.disabled = false;
  }
