// =====================================================
// BASE64 HELPERS
// =====================================================
export function arrayBufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// =====================================================
// RSA KEYPAIR (4096-bit)
// =====================================================
export async function generateRSAKeyPair() {
  return await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
}

// =====================================================
// PUBLIC KEY EXPORT/IMPORT (SPKI)
// =====================================================
export async function exportPublicKeyToBase64(publicKey) {
  const spki = await crypto.subtle.exportKey("spki", publicKey);
  return arrayBufferToBase64(spki);
}

export async function importPublicKeyFromBase64(publicKeyB64) {
  const spki = base64ToArrayBuffer(publicKeyB64);
  return await crypto.subtle.importKey(
    "spki",
    spki,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}

// =====================================================
// PRIVATE KEY EXPORT/IMPORT (PKCS8)
// =====================================================
export async function exportRawPrivateKey(privateKey) {
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", privateKey);
  return arrayBufferToBase64(pkcs8);
}

export async function importPrivateKeyFromBase64(privateKeyB64) {
  const pkcs8 = base64ToArrayBuffer(privateKeyB64);
  return await crypto.subtle.importKey(
    "pkcs8",
    pkcs8,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
}

// =====================================================
// PASSWORD PROTECTION (PBKDF2 + AES-GCM)
// =====================================================
export async function encryptPrivateKeyWithPassword(privateKeyB64, password) {
  const rawPrivate = base64ToArrayBuffer(privateKeyB64);
  const enc = new TextEncoder();

  const salt = crypto.getRandomValues(new Uint8Array(16));

  const pwKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 200000,
      hash: "SHA-256",
    },
    pwKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    rawPrivate
  );

  return {
    encryptedKey: arrayBufferToBase64(encrypted),
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
  };
}

export async function decryptPrivateKeyWithPassword(ciphertextB64, password, saltB64, ivB64) {
  function b64ToBytes(b64) {
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  }

  const ciphertext = b64ToBytes(ciphertextB64);
  const salt = b64ToBytes(saltB64);
  const iv = b64ToBytes(ivB64);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 200000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    ciphertext
  );

  return arrayBufferToBase64(decrypted);
}


// =====================================================
// AUTO-LOAD PRIVATE KEY (decrypts automatically)
// =====================================================
export async function decryptPrivateKeyFromStorage() {
  const encrypted = localStorage.getItem("sv_encrypted_private_key");
  const salt = localStorage.getItem("sv_private_salt");
  const iv = localStorage.getItem("sv_private_iv");
  const password = localStorage.getItem("sv_password");

  if (!encrypted || !salt || !iv || !password) return null;

  const rawB64 = await decryptPrivateKeyWithPassword(encrypted, password, salt, iv);
  return await importPrivateKeyFromBase64(rawB64);
}

// =====================================================
// AES: GENERATE KEY + ENCRYPT + DECRYPT
// =====================================================
export async function generateFileKeyRaw() {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const raw = await crypto.subtle.exportKey("raw", key);

  return {
    key,
    rawB64: arrayBufferToBase64(raw), // required for RSA wrapping
  };
}

export async function encryptFileWithAesKey(aesKey, fileBuffer) {
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    fileBuffer
  );

  return {
    encrypted: new Uint8Array(encrypted),
    ivB64: arrayBufferToBase64(iv),
  };
}

export async function decryptFileWithAesKey(aesKey, encryptedBuffer, ivB64) {
  const iv = base64ToArrayBuffer(ivB64);
  const result = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encryptedBuffer
  );
  return new Uint8Array(result);
}

// =====================================================
// RSA WRAPPING (AES KEY)
// =====================================================
export async function wrapKeyWithPublicKey(aesKey, publicKey) {
  const wrapped = await crypto.subtle.wrapKey(
    "raw",
    aesKey,
    publicKey,
    { name: "RSA-OAEP" }
  );
  return arrayBufferToBase64(wrapped); // backend expects base64 text
}

export async function unwrapKeyWithPrivateKey(wrappedB64, privateKey) {
  const wrapped = base64ToArrayBuffer(wrappedB64);
  return await crypto.subtle.unwrapKey(
    "raw",
    wrapped,
    privateKey,
    { name: "RSA-OAEP" },
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// =====================================================
// RSA UNWRAP (for downloading files)
// =====================================================
export async function unwrapAESKey(privateKey, wrappedB64) {
  const wrapped = base64ToArrayBuffer(wrappedB64);

  return await crypto.subtle.unwrapKey(
    "raw",
    wrapped,
    privateKey,
    { name: "RSA-OAEP" },
    { name: "AES-GCM", length: 256 },
    true,
    ["decrypt"]
  );
}

export async function decryptFile(aesKey, ivBase64, encryptedBytes) {
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encryptedBytes
  );

  return new Blob([decrypted]);
}

