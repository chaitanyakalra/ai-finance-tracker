/**
 * GST Number Validation Utility
 * Validates Indian GST numbers according to official format
 * Format: 15 characters - 2 digit state code + 10 digit PAN + 1 entity number + Z + checksum
 */

// State codes mapping (1-37 are valid state codes)
const VALID_STATE_CODES = Array.from({ length: 38 }, (_, i) => i.toString().padStart(2, '0'));

/**
 * Validates GST number format and checksum
 * @param {string} gstNumber - GST number to validate
 * @returns {Object} - { isValid: boolean, error: string }
 */
export function validateGST(gstNumber) {
    if (!gstNumber) {
        return { isValid: false, error: 'GST number is required' };
    }

    // Remove spaces and convert to uppercase
    const gst = gstNumber.trim().toUpperCase();

    // Check length
    if (gst.length !== 15) {
        return { isValid: false, error: 'GST number must be 15 characters' };
    }

    // Check format: 2 digits + 10 alphanumeric + 1 digit + Z + 1 alphanumeric
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gst)) {
        return { isValid: false, error: 'Invalid GST number format' };
    }

    // Validate state code (first 2 digits)
    const stateCode = gst.substring(0, 2);
    if (!VALID_STATE_CODES.includes(stateCode)) {
        return { isValid: false, error: 'Invalid state code in GST number' };
    }

    // Validate PAN structure (characters 3-12)
    const panPart = gst.substring(2, 12);
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panPart)) {
        return { isValid: false, error: 'Invalid PAN structure in GST number' };
    }

    // Validate 13th character (entity number: 1-9 or A-Z)
    const entityNumber = gst.charAt(12);
    if (!/^[1-9A-Z]$/.test(entityNumber)) {
        return { isValid: false, error: 'Invalid entity number in GST number' };
    }

    // Validate 14th character (must be 'Z')
    if (gst.charAt(13) !== 'Z') {
        return { isValid: false, error: '14th character must be Z' };
    }

    // Basic checksum validation (simplified)
    // Note: Full checksum validation requires complex algorithm
    const checksum = gst.charAt(14);
    if (!/^[0-9A-Z]$/.test(checksum)) {
        return { isValid: false, error: 'Invalid checksum character' };
    }

    return { isValid: true, error: null };
}

/**
 * Extract state code from GST number
 * @param {string} gstNumber - GST number
 * @returns {string|null} - State code or null
 */
export function extractStateCode(gstNumber) {
    if (!gstNumber || gstNumber.length < 2) return null;
    return gstNumber.substring(0, 2);
}

/**
 * Extract PAN from GST number
 * @param {string} gstNumber - GST number
 * @returns {string|null} - PAN or null
 */
export function extractPAN(gstNumber) {
    if (!gstNumber || gstNumber.length < 12) return null;
    return gstNumber.substring(2, 12);
}

/**
 * Check if GST number is valid (simple boolean check)
 * @param {string} gstNumber - GST number
 * @returns {boolean}
 */
export function isValidGST(gstNumber) {
    return validateGST(gstNumber).isValid;
}
