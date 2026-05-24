// ==================== Ronin Wallet Connect - 2dstroy.ron ====================

const RONIN_CHAIN_ID = "0x7e4";
const RONIN_RPC_URL = "https://api.roninchain.com/rpc";

async function connectWallet() {
  if (!window.ronin?.provider) {
    alert("Please install Ronin Wallet!");
    window.open("https://wallet.roninchain.com/", "_blank");
    return;
  }

  try {
    const provider = window.ronin.provider;
    const accounts = await provider.request({ method: "eth_requestAccounts" });

    if (accounts.length === 0) return;

    await ensureCorrectChain(provider);
    localStorage.setItem("roninWallet", accounts[0]);
    await checkRoninAuth();
  } catch (error) {
    console.error("Connection error:", error);
    alert(error.code === 4001 ? "Connection rejected by user." : "Failed to connect wallet.");
  }
}

async function ensureCorrectChain(provider) {
  try {
    let currentChain = await provider.request({ method: "eth_chainId" });
    currentChain = currentChain.toLowerCase();

    if (currentChain !== RONIN_CHAIN_ID.toLowerCase()) {
      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: RONIN_CHAIN_ID }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: RONIN_CHAIN_ID,
              chainName: "Ronin Mainnet",
              nativeCurrency: { name: "RON", symbol: "RON", decimals: 18 },
              rpcUrls: [RONIN_RPC_URL],
              blockExplorerUrls: ["https://app.roninchain.com/"],
            }],
          });
        } else {
          throw switchError;
        }
      }
    }
  } catch (error) {
    console.error("Chain switch failed:", error);
  }
}

async function disconnectWallet() {
  localStorage.removeItem("roninWallet");
  
  if (window.ronin?.provider) {
    try {
      await window.ronin.provider.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }]
      });
    } catch (e) {}
  }

  document.getElementById("wallet-info").style.display = "none";
  document.getElementById("disconnectBtn").style.display = "none";
}

async function checkRoninAuth() {
  const walletInfo = document.getElementById("wallet-info");
  const disconnectBtn = document.getElementById("disconnectBtn");

  if (!window.ronin?.provider) return;

  try {
    const accounts = await window.ronin.provider.request({ method: "eth_accounts" });
    
    if (!accounts || accounts.length === 0) {
      walletInfo.style.display = "none";
      disconnectBtn.style.display = "none";
      return;
    }

    const address = accounts[0];
    const truncated = address.slice(0, 6) + "..." + address.slice(-4);

    walletInfo.innerHTML = `
      ✅ Connected as <strong>${truncated}</strong><br>
      <small style="color:#4ade80;">Ronin Mainnet</small>
    `;
    walletInfo.style.display = "block";
    disconnectBtn.style.display = "inline-block";
  } catch (err) {
    console.error(err);
  }
}

// Event Listeners
document.getElementById("connectBtn").addEventListener("click", connectWallet);
document.getElementById("disconnectBtn").addEventListener("click", disconnectWallet);

// Auto check on load
window.addEventListener("load", () => {
  if (window.ronin?.provider) {
    checkRoninAuth();

    const provider = window.ronin.provider;
    provider.on("accountsChanged", checkRoninAuth);
    provider.on("chainChanged", checkRoninAuth);
  }
});
