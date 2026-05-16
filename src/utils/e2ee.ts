'use client';

// Indico End-to-End Encryption Utility
// Uses Web Crypto API (SubtleCrypto) for ECDH key exchange and AES-GCM encryption

const arrayBufferToBase64 = (buffer: ArrayBuffer | Uint8Array): string => {
  let binary = '';
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Generates a new ECDH P-256 key pair for the user
 * Stores the keys in localStorage (simulating a secure device enclave)
 */
export const generateE2EEKeys = async () => {
  if (typeof window === 'undefined') return null;

  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );

  const publicKeyJWK = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privateKeyJWK = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);

  const pub = JSON.stringify(publicKeyJWK);
  const priv = JSON.stringify(privateKeyJWK);

  localStorage.setItem('indico_pub_key', pub);
  localStorage.setItem('indico_priv_key', priv);

  return { publicKey: pub, privateKey: priv };
};

/**
 * Retrieves the local user's E2EE keys
 */
export const getMyE2EEKeys = () => {
  if (typeof window === 'undefined') return null;
  const priv = localStorage.getItem('indico_priv_key');
  const pub = localStorage.getItem('indico_pub_key');
  if (priv && pub) return { privateKey: priv, publicKey: pub };
  return null;
};

/**
 * Derives a shared symmetric AES-GCM key from my private key and their public key
 */
export const deriveSharedKey = async (myPrivJWK: string, theirPubJWK: string) => {
  try {
    const myPriv = await window.crypto.subtle.importKey(
      'jwk', JSON.parse(myPrivJWK),
      { name: 'ECDH', namedCurve: 'P-256' },
      true, ['deriveKey']
    );

    const theirPub = await window.crypto.subtle.importKey(
      'jwk', JSON.parse(theirPubJWK),
      { name: 'ECDH', namedCurve: 'P-256' },
      true, []
    );

    return await window.crypto.subtle.deriveKey(
      { name: 'ECDH', public: theirPub },
      myPriv,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  } catch (err) {
    console.error('Failed to derive shared key:', err);
    return null;
  }
};

/**
 * Encrypts a message using a shared key
 * Returns a JSON string containing the ciphertext and IV
 */
export const encryptE2EE = async (text: string, sharedKey: CryptoKey): Promise<string> => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    sharedKey,
    encoded
  );

  return JSON.stringify({
    ct: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv)
  });
};

/**
 * Decrypts a message using a shared key
 */
export const decryptE2EE = async (jsonCipher: string, sharedKey: CryptoKey): Promise<string> => {
  try {
    const { ct, iv: ivBase64 } = JSON.parse(jsonCipher);
    const ciphertext = base64ToArrayBuffer(ct);
    const iv = base64ToArrayBuffer(ivBase64);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      sharedKey,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.warn('E2EE Decryption failed:', err);
    return '[Decryption Error: Message might not be encrypted for you]';
  }
};

// Legacy support for community "encryption"
import CryptoJS from 'crypto-js';
const getCommunityKey = (communityId: string) => {
  const salt = process.env.NEXT_PUBLIC_E2EE_SALT || 'indico-secure-salt-2026';
  return CryptoJS.SHA256(communityId + salt).toString();
};
export const encryptTextLegacy = (text: string, communityId: string): string => {
  if (!text) return text;
  const key = getCommunityKey(communityId);
  return CryptoJS.AES.encrypt(text, key).toString();
};
export const decryptTextLegacy = (cipherText: string, communityId: string): string => {
  if (!cipherText || !cipherText.startsWith('U2FsdGVkX1')) return cipherText;
  const key = getCommunityKey(communityId);
  const bytes = CryptoJS.AES.decrypt(cipherText, key);
  return bytes.toString(CryptoJS.enc.Utf8) || cipherText;
};

/**
 * Onboards new subscribers by encrypting exclusive content keys for them.
 * This runs on the creator's client to maintain E2EE.
 */
export const onboardSubscribers = async (supabase: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Find my active subscribers who have public keys
    const { data: subscribers } = await supabase
      .from('subscriptions')
      .select('subscriber_id, profiles:subscriber_id(id, public_key)')
      .eq('creator_id', user.id)
      .eq('status', 'active');

    if (!Array.isArray(subscribers) || subscribers.length === 0) return;
    
    // 2. Find my exclusive encrypted posts
    const { data: posts } = await (supabase as any)
      .from('posts')
      .select('id')
      .eq('author_id', user.id)
      .eq('is_exclusive', true)
      .eq('is_encrypted', true);

    if (!Array.isArray(posts) || posts.length === 0) return;

    console.log(`[E2EE] Onboarding subscribers for ${posts.length} posts and ${subscribers.length} subscribers...`);

    const myKeys = getMyE2EEKeys();
    if (!myKeys) return;

    for (const post of posts) {
      // Fetch my own encrypted key for this post once per post
      const { data: myKeyData, error: myKeyError } = await (supabase as any)
        .from('content_keys')
        .select('encrypted_key')
        .eq('content_id', post.id)
        .eq('user_id', user.id)
        .single();

      if (myKeyError && myKeyError.code !== 'PGRST116') throw myKeyError;
      if (!myKeyData) continue;

      const mySharedKey = await deriveSharedKey(myKeys.privateKey, myKeys.publicKey);
      if (!mySharedKey) continue;

      const contentKey = await decryptE2EE(myKeyData.encrypted_key, mySharedKey);
      if (contentKey.startsWith('[Decryption Error')) continue;

      // Process subscribers sequentially to be safe with Edge CPU limits
      for (const sub of subscribers) {
        let subProfile = (sub as any).profiles;
        if (Array.isArray(subProfile)) subProfile = subProfile[0];
        
        if (!subProfile?.public_key) continue;

        // Check if they already have the key
        const { data: existing, error: keyError } = await (supabase as any)
          .from('content_keys')
          .select('id')
          .eq('content_id', post.id)
          .eq('user_id', subProfile.id)
          .single();

        if (keyError && keyError.code !== 'PGRST116') continue;
        if (existing) continue;

        // Encrypt this content key for the subscriber
        const subSharedKey = await deriveSharedKey(myKeys.privateKey, subProfile.public_key);
        if (subSharedKey) {
          const encryptedForSub = await encryptE2EE(contentKey, subSharedKey);
          await (supabase as any).from('content_keys').insert({
            content_id: post.id,
            user_id: subProfile.id,
            encrypted_key: encryptedForSub
          });
          console.log(`[E2EE] Shared key for post ${post.id} with subscriber ${subProfile.id}`);
        }
      }
    }
  } catch (err) {
    console.error('[E2EE] Subscriber onboarding failed:', err);
  }
};
