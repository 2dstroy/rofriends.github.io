import { auth, db } from "../firebase.js";
import { signInWithCustomToken } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const RONIN_CHAIN_ID = "0x7e4";

function truncateAddress(addr) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

async function connectRoninWallet() {
  const btn = document.getElementById("connectBtn");

  if (!window.ronin?.provider) {
    alert("Ronin Wallet not detected!\nPlease install the Ronin Wallet extension.");
    window.open("https://wallet.roninchain.com/", "_blank");
    return;
  }

  try {
    btn.innerHTML = "Connecting & Signing...";
    btn.disabled = true;

    const provider = window.ronin.provider;

    const accounts = await provider.request({ method: "eth_requestAccounts" });
    const wallet = accounts[0];

    // Switch network
    const chainId = await provider.request({ method: "eth_chainId" });
    if (chainId.toLowerCase() !== RONIN_CHAIN_ID.toLowerCase()) {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: RONIN_CHAIN_ID }]
      });
    }

    // Sign message
    const message = `Sign in to ROFriends SocialHub\nWallet: ${wallet}\nTime: ${Date.now()}`;
    const signature = await provider.request({
      method: "personal_sign",
      params: [message, wallet]
    });

    // Call Cloud Function
    const response = await fetch("https://us-central1-rofriends-ab0b8.cloudfunctions.net/createCustomToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet, signature, message })
    });

    const result = await response.json();

    if (!result.success) throw new Error(result.error || "Authentication failed");

    await signInWithCustomToken(auth, result.customToken);

    await setDoc(doc(db, "users", wallet.toLowerCase()), {
      wallet,
      lastLogin: serverTimestamp(),
      network: "Ronin Mainnet"
    }, { merge: true });

    localStorage.setItem("roninWallet", wallet);
    updateWalletUI(wallet);

    alert("✅ Successfully signed in with Ronin Wallet!");

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
    ✅ Connected & Authenticated!<br>
    <strong>${truncateAddress(wallet)}</strong><br>
    <small style="color:#4ade80;">Ronin Mainnet</small>
  `;
  el.style.display = "block";
}

function disconnectWallet() {
  localStorage.removeItem("roninWallet");
  document.getElementById("walletAddress").style.display = "none";
  document.getElementById("disconnectBtn").style.display = "none";
}

// Event Listeners
document.getElementById("connectBtn").addEventListener("click", connectRoninWallet);
document.getElementById("disconnectBtn").addEventListener("click", disconnectWallet);
