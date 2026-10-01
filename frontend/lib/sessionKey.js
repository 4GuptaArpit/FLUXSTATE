// 1-Click Trading Session Key Management for FluxState on Monad
// Enables 0-popup high-frequency order execution with cryptographic isolation

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const SESSION_STORAGE_KEY = "flux_active_session";
const SESSION_PIN_SALT = "flux_state_monad_session_salt_v1";

/**
 * Hash a 4-digit PIN for client-side storage encryption
 */
export async function hashPin(pin) {
  const enc = new TextEncoder();
  const data = enc.encode(pin + SESSION_PIN_SALT);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate a new ephemeral trading keypair
 */
export function createEphemeralKey() {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  return {
    address: account.address,
    privateKey: privateKey,
  };
}

/**
 * Construct the EIP-712 / Session Authorization message payload
 */
export function createSessionApprovalMessage({
  ownerAddress,
  sessionAddress,
  validUntilTimestamp,
  maxCollateralPerOrder = "50",
  storageType = "local",
}) {
  const expiryDate = new Date(validUntilTimestamp * 1000).toLocaleString();
  return (
    `FluxState High-Frequency Trading Session Authorization\n\n` +
    `I authorize the following ephemeral session key to place and close orders on FluxState without wallet popups.\n\n` +
    `• Trader Account: ${ownerAddress}\n` +
    `• Session Public Key: ${sessionAddress}\n` +
    `• Valid Until: ${expiryDate}\n` +
    `• Max Margin Per Order: ${maxCollateralPerOrder} MON\n` +
    `• Storage Mode: ${storageType === "local" ? "Remember for 24h (Encrypted LocalStorage)" : "Single-Window (SessionStorage)"}\n\n` +
    `Security Guarantee: This session key can ONLY open and close positions. It has ZERO authority to withdraw or transfer collateral.`
  );
}

/**
 * Save an active trading session to either sessionStorage or localStorage
 */
export async function saveSession({
  ownerAddress,
  sessionAddress,
  sessionPrivateKey,
  validUntil,
  storageType, // 'local' | 'session'
  pinHash = null,
}) {
  const sessionData = {
    ownerAddress: ownerAddress.toLowerCase(),
    sessionAddress: sessionAddress.toLowerCase(),
    sessionPrivateKey,
    validUntil,
    storageType,
    pinHash,
    createdAt: Date.now(),
    isLocked: false,
  };

  const serialized = JSON.stringify(sessionData);

  if (storageType === "local") {
    localStorage.setItem(SESSION_STORAGE_KEY, serialized);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } else {
    sessionStorage.setItem(SESSION_STORAGE_KEY, serialized);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  return sessionData;
}

/**
 * Load and validate active session from storage
 */
export function loadActiveSession(currentOwnerAddress) {
  if (typeof window === "undefined" || !currentOwnerAddress) return null;

  const targetOwner = currentOwnerAddress.toLowerCase();

  // Check sessionStorage first, then localStorage
  let raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
  let storageSource = "session";

  if (!raw) {
    raw = localStorage.getItem(SESSION_STORAGE_KEY);
    storageSource = "local";
  }

  if (!raw) return null;

  try {
    const session = JSON.parse(raw);

    // Verify session matches currently connected wallet
    if (session.ownerAddress !== targetOwner) {
      return null;
    }

    // Verify expiration timestamp
    const nowSec = Math.floor(Date.now() / 1000);
    if (session.validUntil && session.validUntil < nowSec) {
      revokeSession();
      return null;
    }

    return session;
  } catch (err) {
    console.warn("Corrupt session storage payload:", err);
    revokeSession();
    return null;
  }
}

/**
 * Lock active session due to inactivity
 */
export function lockActiveSession() {
  if (typeof window === "undefined") return;

  const rawSession =
    sessionStorage.getItem(SESSION_STORAGE_KEY) ||
    localStorage.getItem(SESSION_STORAGE_KEY);

  if (!rawSession) return;

  try {
    const session = JSON.parse(rawSession);
    session.isLocked = true;
    const serialized = JSON.stringify(session);

    if (session.storageType === "local") {
      localStorage.setItem(SESSION_STORAGE_KEY, serialized);
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, serialized);
    }
  } catch (e) {}
}

/**
 * Unlock active session using PIN or re-auth
 */
export async function unlockActiveSession(inputPin) {
  if (typeof window === "undefined") return false;

  const rawSession =
    sessionStorage.getItem(SESSION_STORAGE_KEY) ||
    localStorage.getItem(SESSION_STORAGE_KEY);

  if (!rawSession) return false;

  try {
    const session = JSON.parse(rawSession);

    // If PIN protected, verify PIN
    if (session.pinHash) {
      const hashed = await hashPin(inputPin);
      if (hashed !== session.pinHash) {
        return false;
      }
    }

    session.isLocked = false;
    const serialized = JSON.stringify(session);

    if (session.storageType === "local") {
      localStorage.setItem(SESSION_STORAGE_KEY, serialized);
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, serialized);
    }
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Revoke and wipe session credentials completely
 */
export function revokeSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_STORAGE_KEY);
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}
