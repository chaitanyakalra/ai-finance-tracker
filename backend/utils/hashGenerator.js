import crypto from 'crypto';

/**
 * Generate SHA-256 hash from buffer
 * @param {Buffer} buffer - File buffer
 * @returns {string} - Hash string
 */
export function generateHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Generate hash from file path (for server-side files)
 * @param {string} filePath - Path to file
 * @returns {Promise<string>} - Hash string
 */
export async function generateHashFromFile(filePath) {
    const fs = await import('fs/promises');
    const buffer = await fs.readFile(filePath);
    return generateHash(buffer);
}

/**
 * Generate perceptual hash for duplicate detection
 * This is a simple implementation - for production, consider using libraries like 'sharp' with pHash
 * @param {Buffer} buffer - Image buffer
 * @returns {string} - Hash string
 */
export function generatePerceptualHash(buffer) {
    // For now, using SHA-256. In production, implement actual perceptual hashing
    // to detect similar images (e.g., slightly edited bills)
    return generateHash(buffer);
}
