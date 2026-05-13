import CryptoJS from 'crypto-js';

// Since we are running in a browser environment, we will use a symmetric key strategy
// In a true E2EE architecture, each user has a public/private key pair and the symmetric
// key is encrypted for each recipient. 
// For this platform, we simulate E2EE by deriving a symmetric key from the community ID.

const getCommunityKey = (communityId: string) => {
  // A salt to ensure keys are unique
  const salt = process.env.NEXT_PUBLIC_E2EE_SALT || 'indico-secure-salt-2026';
  return CryptoJS.SHA256(communityId + salt).toString();
};

export const encryptText = (text: string, communityId: string): string => {
  try {
    if (!text) return text;
    const key = getCommunityKey(communityId);
    return CryptoJS.AES.encrypt(text, key).toString();
  } catch (err) {
    console.error('Encryption failed:', err);
    return text;
  }
};

export const decryptText = (cipherText: string, communityId: string): string => {
  try {
    if (!cipherText) return cipherText;
    // Don't decrypt if it's clearly not encrypted (e.g. legacy plain text)
    if (!cipherText.startsWith('U2FsdGVkX1')) return cipherText;
    
    const key = getCommunityKey(communityId);
    const bytes = CryptoJS.AES.decrypt(cipherText, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || cipherText; // Fallback to cipherText if decryption yields empty
  } catch (err) {
    console.warn('Decryption failed, returning raw text:', err);
    return cipherText;
  }
};
