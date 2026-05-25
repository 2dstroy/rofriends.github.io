const { onCall } = require("firebase-functions/v2/https");
const { getAuth } = require("firebase-admin/auth");
const { initializeApp } = require("firebase-admin/app");
const { ethers } = require("ethers");

initializeApp();

// Create Custom Token for Ronin Wallet
exports.createCustomToken = onCall(async (request) => {
  const { wallet, signature, message } = request.data;

  // Validation
  if (!wallet || !signature || !message) {
    throw new Error("Missing wallet, signature or message");
  }

  try {
    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== wallet.toLowerCase()) {
      throw new Error("Invalid signature");
    }

    // Create Firebase Custom Token (using wallet address as UID)
    const customToken = await getAuth().createCustomToken(wallet.toLowerCase());

    console.log(`✅ Custom token created for wallet: ${wallet}`);

    return {
      success: true,
      customToken: customToken,
      wallet: wallet
    };

  } catch (error) {
    console.error("Cloud Function Error:", error);
    throw new Error("Authentication failed: " + error.message);
  }
});
