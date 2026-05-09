const PRIVATE_KEY_ITERATIONS = 390000;
const RSA_ALGORITHM = {
  name: "RSA-OAEP",
  modulusLength: 4096,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
};

export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64) {
  const normalized = base64.replace(/\s/g, "");
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

function pemToBase64(value) {
  return value
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s/g, "");
}

function normalizeKeyToBuffer(key) {
  if (typeof key !== "string") return key;
  return base64ToArrayBuffer(key.includes("-----BEGIN") ? pemToBase64(key) : key);
}

async function derivePasswordKey(password, salt, usage) {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PRIVATE_KEY_ITERATIONS,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    [usage]
  );
}

export async function createEncryptedKeyBundle(masterPassword) {
  const pair = await crypto.subtle.generateKey(RSA_ALGORITHM, true, ["encrypt", "decrypt"]);
  const publicKey = await crypto.subtle.exportKey("spki", pair.publicKey);
  const privateKey = await crypto.subtle.exportKey("pkcs8", pair.privateKey);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await derivePasswordKey(masterPassword, salt, "encrypt");
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, privateKey);

  return {
    publicKey: arrayBufferToBase64(publicKey),
    encryptedPrivateKey: {
      version: 1,
      kdf: "PBKDF2",
      hash: "SHA-256",
      iterations: PRIVATE_KEY_ITERATIONS,
      salt: arrayBufferToBase64(salt),
      iv: arrayBufferToBase64(iv),
      ciphertext: arrayBufferToBase64(ciphertext),
    },
  };
}

export async function importPublicKey(publicKey) {
  return crypto.subtle.importKey(
    "spki",
    normalizeKeyToBuffer(publicKey),
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["wrapKey", "encrypt"]
  );
}

export async function unlockPrivateKey(encryptedPrivateKey, masterPassword) {
  if (!encryptedPrivateKey || !masterPassword) {
    throw new Error("Vault password is required");
  }

  const salt = new Uint8Array(base64ToArrayBuffer(encryptedPrivateKey.salt));
  const iv = new Uint8Array(base64ToArrayBuffer(encryptedPrivateKey.iv));
  const key = await derivePasswordKey(masterPassword, salt, "decrypt");
  const privateKeyBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    base64ToArrayBuffer(encryptedPrivateKey.ciphertext)
  );

  return crypto.subtle.importKey(
    "pkcs8",
    privateKeyBuffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["unwrapKey", "decrypt"]
  );
}

export async function encryptFileForUpload(file, ownerPublicKey) {
  const fileKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    fileKey,
    await file.arrayBuffer()
  );
  const publicKey = await importPublicKey(ownerPublicKey);
  const wrappedKey = await crypto.subtle.wrapKey("raw", fileKey, publicKey, {
    name: "RSA-OAEP",
  });

  return {
    encryptedBlob: new Blob([encryptedBuffer], { type: "application/octet-stream" }),
    wrappedKey: arrayBufferToBase64(wrappedKey),
    iv: arrayBufferToBase64(iv),
  };
}

export async function unwrapFileKey(privateKey, wrappedKey) {
  return crypto.subtle.unwrapKey(
    "raw",
    base64ToArrayBuffer(wrappedKey),
    privateKey,
    { name: "RSA-OAEP" },
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function decryptFileBlob(encryptedBlob, wrappedKey, iv, privateKey) {
  const fileKey = await unwrapFileKey(privateKey, wrappedKey);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(base64ToArrayBuffer(iv)) },
    fileKey,
    await encryptedBlob.arrayBuffer()
  );
  return new Blob([decrypted]);
}

export async function rewrapFileKey(privateKey, wrappedKey, recipientPublicKey) {
  const fileKey = await unwrapFileKey(privateKey, wrappedKey);
  const publicKey = await importPublicKey(recipientPublicKey);
  const nextWrappedKey = await crypto.subtle.wrapKey("raw", fileKey, publicKey, {
    name: "RSA-OAEP",
  });
  return arrayBufferToBase64(nextWrappedKey);
}

export async function encryptVaultPayload(payload, ownerPublicKey) {
  const payloadKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, payloadKey, encoded);
  const publicKey = await importPublicKey(ownerPublicKey);
  const wrappedKey = await crypto.subtle.wrapKey("raw", payloadKey, publicKey, {
    name: "RSA-OAEP",
  });

  return {
    encryptedPayload: arrayBufferToBase64(ciphertext),
    wrappedKey: arrayBufferToBase64(wrappedKey),
    iv: arrayBufferToBase64(iv),
  };
}

export async function decryptVaultPayload(entry, privateKey) {
  const payloadKey = await unwrapFileKey(privateKey, entry.wrapped_key);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(base64ToArrayBuffer(entry.iv)) },
    payloadKey,
    base64ToArrayBuffer(entry.encrypted_payload)
  );
  return JSON.parse(new TextDecoder().decode(decrypted));
}
