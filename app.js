// app.js
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

// Your Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBS_KFq-QLD89xyq1kTE3FJ62E8HFP09BI",
  authDomain: "rofriends-ab0b8.firebaseapp.com",
  projectId: "rofriends-ab0b8",
  storageBucket: "rofriends-ab0b8.firebasestorage.app",
  messagingSenderId: "309137703504",
  appId: "1:309137703504:web:ee535debe2c015630ec755"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const RONIN_CHAIN_ID = "0x7e4";

function truncateAddress(addr) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

async function connectRoninWallet() {
  const btn = document.getElementById("connectBtn");

  if (!window.ronin?.provider) {
    alert("Ronin Wallet not detected!");
    window.open("https://wallet.roninchain.com/", "_blank");
    return;
  }

  try {
    btn.innerHTML = "Connecting & Signing...";
    btn.disabled = true;

    const provider = window.ronin.provider;

    // Connect wallet
    const accounts = await provider.request({ method: "eth_requestAccounts" });
    const wallet = accounts[0];

    // Check/Switch Network
    const chainId = await provider.request({ method: "eth_chainId" });
    if (chainId.toLowerCase() !== RONIN_CHAIN_ID.toLowerCase()) {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: RONIN_CHAIN_ID }]
      });
    }

    // Sign Message (Proof of Ownership)
    const message = `Sign in to ROFriends\nWallet: ${wallet}\nTime: ${Date.now()}`;
    const signature = await provider.request({
      method: "personal_sign",
      params: [message, wallet]
    });

    // TODO: Send wallet + signature to your backend to get custom token
    // For now, we'll show a placeholder
    alert("✅ Wallet connected!\n\nSignature received.\n\nNext step: Send to backend for Firebase Auth.");

    // Example UI Update
    updateWalletUI(wallet);

  } catch (error) {
    console.error(error);
    alert("Error: " + error.message);
  } finally {
    btn.innerHTML = "Sign in using Ronin Wallet";
    btn.disabled = false;
  }
}

function updateWalletUI(wallet) {
  const el = document.getElementById("walletAddress");
  el.innerHTML = `
    ✅ Connected Successfully!<br>
    <strong>${truncateAddress(wallet)}</strong><br>
    <small>Ronin Mainnet</small>
  `;
  el.style.display = "block";
}

// Disconnect function
function disconnectWallet() {
  localStorage.removeItem("roninWallet");
  document.getElementById("walletAddress").style.display = "none";
  document.getElementById("disconnectBtn").style.display = "none";
}

// Event Listeners
document.getElementById("connectBtn").addEventListener("click", connectRoninWallet);
document.getElementById("disconnectBtn").addEventListener("click", disconnectWallet);
