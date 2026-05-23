const RONIN_CHAIN_ID = "0x7e4"; // Ronin Mainnet

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

    // Request Account
    const accounts = await provider.request({
      method: "eth_requestAccounts"
    });
    const wallet = accounts[0];

    // === Chain Validation ===
    let chainId = await provider.request({ method: 'eth_chainId' });

    if (chainId !== RONIN_CHAIN_ID) {
      const switchConfirmed = confirm(
        "You are not on the Ronin Network.\n\nWould you like to switch now?"
      );

      if (switchConfirmed) {
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: RONIN_CHAIN_ID }]
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            alert("Ronin Network is not added in your wallet. Please add it manually.");
          } else {
            alert("Failed to switch network. Please switch to Ronin Network manually.");
          }
          return;
        }
      } else {
        alert("Please switch to Ronin Network to continue.");
        return;
      }
    }

    // ==================== SUCCESS ====================
    const truncated = wallet.substring(0, 6) + "..." + wallet.substring(wallet.length - 4);
    localStorage.setItem("roninWallet", wallet);

    walletAddressEl.innerHTML = `
      ✅ Connected Successfully!<br>
      <strong>${truncated}</strong><br>
      <small style="color:#4ade80;">Ronin Mainnet</small>
    `;
    walletAddressEl.style.color = "#4ade80";
    walletAddressEl.style.display = "block";
    disconnectBtn.style.display = "inline-block";

    // ✅ REDIRECT TO PROFILE AFTER SUCCESSFUL CONNECTION
    setTimeout(() => {
      window.location.href = "profile.html";
    }, 1200); // 1.2 second delay so user can see success message

  } catch (error) {
    console.error(error);
    if (error.code === 4001) {
      alert("Connection rejected by user.");
    } else {
      alert("Failed to connect to Ronin Wallet.");
    }
  } finally {
    btn.innerHTML = "Sign in using Ronin Wallet";
    btn.disabled = false;
  }
}

function disconnectWallet() {
  localStorage.removeItem("roninWallet");
  document.getElementById("walletAddress").style.display = "none";
  document.getElementById("disconnectBtn").style.display = "none";
  alert("Wallet disconnected.");
}

// Auto-connect if previously saved
window.addEventListener("load", () => {
  const savedWallet = localStorage.getItem("roninWallet");
  if (savedWallet) {
    const walletAddressEl = document.getElementById("walletAddress");
    const disconnectBtn = document.getElementById("disconnectBtn");
    const truncated = savedWallet.substring(0, 6) + "..." + savedWallet.substring(savedWallet.length - 4);

    walletAddressEl.innerHTML = `
      ✅ Connected!<br>
      <strong>${truncated}</strong><br>
      <small style="color:#4ade80;">Ronin Mainnet</small>
    `;
    walletAddressEl.style.color = "#4ade80";
    walletAddressEl.style.display = "block";
    disconnectBtn.style.display = "inline-block";

    // Optional: Auto redirect if already connected on page load
    // setTimeout(() => { window.location.href = "profile.html"; }, 800);
  }
});

// Attach button listeners
document.getElementById("connectBtn").addEventListener("click", connectRoninWallet);
document.getElementById("disconnectBtn").addEventListener("click", disconnectWallet);
