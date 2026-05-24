<script>
// Ronin Mainnet
const RONIN_CHAIN_ID = "0x7e4";
const RONIN_RPC_URL = "https://api.roninchain.com/rpc";

// Example popular NFT contracts on Ronin (you can add more)
const NFT_CONTRACTS = [
  "0x32950db2a7164ae83312192536fcfe1c2c1f1e3b", // Example: Axie Infinity Land (replace with real ones)
  "0x...your-contract-here...", 
  // Add more contract addresses as needed
];

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
    alert(error.code === 4001 ? "Connection rejected." : "Failed to connect wallet.");
  }
}

async function ensureCorrectChain(provider) { /* ... same as before ... */ }

async function disconnectWallet() { /* ... same as before ... */ }

async function checkRoninAuth() { /* ... same as before ... */ }

// ==================== NEW: Get NFTs Function ====================

async function getNFTs(address) {
  if (!address) {
    console.error("Address is required");
    return [];
  }

  const nfts = [];

  for (const contractAddress of NFT_CONTRACTS) {
    try {
      // 1. Get balance using balanceOf
      const balanceData = {
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{
          to: contractAddress,
          data: "0x70a08231" + address.slice(2).padStart(64, '0') // balanceOf(address)
        }, "latest"]
      };

      const balanceRes = await fetch(RONIN_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(balanceData)
      });

      const balanceJson = await balanceRes.json();
      const balance = parseInt(balanceJson.result, 16);

      if (balance > 0) {
        // For simplicity, fetch first few tokens (you can expand this)
        for (let i = 0; i < Math.min(balance, 10); i++) { // limit to 10 per contract
          const tokenId = await getTokenByIndex(contractAddress, address, i);
          if (tokenId) {
            const metadata = await getTokenMetadata(contractAddress, tokenId);
            nfts.push({
              contract: contractAddress,
              tokenId: tokenId,
              metadata: metadata
            });
          }
        }
      }
    } catch (err) {
      console.error(`Error fetching NFTs from ${contractAddress}:`, err);
    }
  }

  return nfts;
}

// Helper: Get token ID by index (ERC721Enumerable)
async function getTokenByIndex(contractAddress, owner, index) {
  try {
    const data = "0x4f6ccce7" + 
                 owner.slice(2).padStart(64, '0') + 
                 index.toString(16).padStart(64, '0');

    const res = await fetch(RONIN_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to: contractAddress, data: data }, "latest"]
      })
    });

    const json = await res.json();
    return json.result ? parseInt(json.result, 16) : null;
  } catch (e) {
    return null;
  }
}

// Helper: Get tokenURI
async function getTokenMetadata(contractAddress, tokenId) {
  try {
    const data = "0xc87b56dd" + tokenId.toString(16).padStart(64, '0'); // tokenURI(uint256)

    const res = await fetch(RONIN_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to: contractAddress, data: data }, "latest"]
      })
    });

    const json = await res.json();
    if (!json.result) return null;

    const uri = hexToString(json.result);
    // Fetch metadata if it's a http/https link
    if (uri.startsWith("http")) {
      const metaRes = await fetch(uri);
      return await metaRes.json();
    }
    return { uri };
  } catch (e) {
    return null;
  }
}

function hexToString(hex) {
  hex = hex.replace(/^0x/, '');
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    const char = String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    if (char !== '\0') str += char;
  }
  return str;
}

// Event Listeners (same as before)
document.getElementById("connectBtn").addEventListener("click", connectWallet);
document.getElementById("disconnectBtn").addEventListener("click", disconnectWallet);

window.addEventListener("load", () => {
  if (window.ronin?.provider) {
    checkRoninAuth();
    const provider = window.ronin.provider;
    provider.on("accountsChanged", checkRoninAuth);
    provider.on("chainChanged", checkRoninAuth);
  }
});
</script>
