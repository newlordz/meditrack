import crypto from 'crypto';

// Base32 Decode
function base32Decode(base32) {
    const cleaned = base32.replace(/=+$/, '').toUpperCase().replace(/ /g, '');
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    const output = [];
    
    for (let i = 0; i < cleaned.length; i++) {
        const val = alphabet.indexOf(cleaned[i]);
        if (val === -1) {
            throw new Error('Invalid base32 character');
        }
        value = (value << 5) | val;
        bits += 5;
        if (bits >= 8) {
            output.push((value >>> (bits - 8)) & 0xff);
            bits -= 8;
        }
    }
    return Buffer.from(output);
}

// Generate standard 6-digit TOTP
export function generateTOTP(secret, timeOffset = 0) {
    const key = base32Decode(secret);
    const epoch = Math.floor(Date.now() / 1000) + timeOffset;
    const counter = Buffer.alloc(8);
    const counterVal = Math.floor(epoch / 30);
    
    let temp = counterVal;
    for (let i = 7; i >= 0; i--) {
        counter[i] = temp & 0xff;
        temp = temp >> 8;
    }
    
    const hmac = crypto.createHmac('sha1', key).update(counter).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const code = ((hmac[offset] & 0x7f) << 24) |
                 ((hmac[offset + 1] & 0xff) << 16) |
                 ((hmac[offset + 2] & 0xff) << 8) |
                 (hmac[offset + 3] & 0xff);
    
    return String(code % 1000000).padStart(6, '0');
}

// Verify TOTP with a clock drift window of +/- 1 (+/- 30s)
export function verifyTOTP(token, secret) {
    if (!token || !secret) return false;
    const cleanToken = token.trim();
    if (cleanToken.length !== 6) return false;
    
    for (let offset = -1; offset <= 1; offset++) {
        const expected = generateTOTP(secret, offset * 30);
        if (expected === cleanToken) {
            return true;
        }
    }
    return false;
}

// Helper to generate a random base32 secret
export function generateSecret(length = 16) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        secret += alphabet[bytes[i] % alphabet.length];
    }
    return secret;
}
