/**
 * Bill Validation Utility
 * Validates mathematical accuracy and format of bill data
 */

/**
 * Validate bill mathematical accuracy
 * @param {Object} billData - Extracted bill data
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validateBillMath(billData) {
    const errors = [];
    
    if (!billData) {
        return { isValid: false, errors: ['No bill data provided'] };
    }

    const { items, subtotal, tax, taxPercentage, total } = billData;

    // Validate items sum to subtotal
    if (items && items.length > 0 && subtotal !== undefined) {
        const calculatedSubtotal = items.reduce((sum, item) => {
            const itemTotal = item.quantity * item.price;
            
            // Check individual item total
            if (Math.abs(itemTotal - item.total) > 0.01) {
                errors.push(`Item "${item.name}" total mismatch: ${item.total} should be ${itemTotal.toFixed(2)}`);
            }
            
            return sum + itemTotal;
        }, 0);

        // Allow 1 rupee tolerance for rounding
        if (Math.abs(calculatedSubtotal - subtotal) > 1) {
            errors.push(`Subtotal mismatch: stated ${subtotal}, calculated ${calculatedSubtotal.toFixed(2)}`);
        }
    }

    // Validate tax calculation
    if (subtotal !== undefined && tax !== undefined && taxPercentage !== undefined) {
        const calculatedTax = (subtotal * taxPercentage) / 100;
        
        // Allow 1 rupee tolerance for rounding
        if (Math.abs(calculatedTax - tax) > 1) {
            errors.push(`Tax calculation error: stated ${tax}, should be ${calculatedTax.toFixed(2)} (${taxPercentage}% of ${subtotal})`);
        }
    }

    // Validate total = subtotal + tax
    if (subtotal !== undefined && tax !== undefined && total !== undefined) {
        const calculatedTotal = subtotal + tax;
        
        // Allow 1 rupee tolerance for rounding
        if (Math.abs(calculatedTotal - total) > 1) {
            errors.push(`Total mismatch: stated ${total}, should be ${calculatedTotal.toFixed(2)} (${subtotal} + ${tax})`);
        }
    }

    // Validate GST percentage (common rates in India: 0, 5, 12, 18, 28)
    const validGSTRates = [0, 5, 12, 18, 28];
    if (taxPercentage !== undefined && !validGSTRates.includes(taxPercentage)) {
        errors.push(`Unusual GST rate: ${taxPercentage}% (common rates: 5%, 12%, 18%, 28%)`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate bill date
 * @param {Date|string} billDate - Bill date
 * @returns {Object} - { isValid: boolean, error: string }
 */
export function validateBillDate(billDate) {
    if (!billDate) {
        return { isValid: false, error: 'Bill date is required' };
    }

    const date = new Date(billDate);
    
    // Check if valid date
    if (isNaN(date.getTime())) {
        return { isValid: false, error: 'Invalid date format' };
    }

    // Check if date is not in the future
    const now = new Date();
    if (date > now) {
        return { isValid: false, error: 'Bill date cannot be in the future' };
    }

    // Check if date is not too old (e.g., more than 10 years)
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    if (date < tenYearsAgo) {
        return { isValid: false, error: 'Bill date is suspiciously old (more than 10 years)' };
    }

    return { isValid: true, error: null };
}

/**
 * Validate price reasonability
 * @param {number} price - Price to validate
 * @param {string} itemName - Item name for context
 * @returns {Object} - { isValid: boolean, warning: string }
 */
export function validatePriceReasonability(price, itemName = 'Item') {
    const warnings = [];

    if (price < 0) {
        return { isValid: false, warning: `${itemName} has negative price: ${price}` };
    }

    if (price === 0) {
        warnings.push(`${itemName} has zero price`);
    }

    // Flag extremely high prices (over 1 lakh rupees for a single item)
    if (price > 100000) {
        warnings.push(`${itemName} has unusually high price: ₹${price}`);
    }

    return {
        isValid: true,
        warning: warnings.length > 0 ? warnings.join(', ') : null
    };
}

/**
 * Validate bill format and required fields
 * @param {Object} billData - Extracted bill data
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validateBillFormat(billData) {
    const errors = [];

    if (!billData) {
        return { isValid: false, errors: ['No bill data provided'] };
    }

    // Check for required fields
    if (!billData.merchantName || billData.merchantName.trim() === '') {
        errors.push('Merchant name is missing');
    }

    if (!billData.billNumber || billData.billNumber.trim() === '') {
        errors.push('Bill number is missing');
    }

    if (!billData.billDate) {
        errors.push('Bill date is missing');
    }

    if (!billData.total || billData.total <= 0) {
        errors.push('Total amount is missing or invalid');
    }

    // If total > 500, GST number should be present (as per Indian regulations)
    if (billData.total > 500 && (!billData.gstNumber || billData.gstNumber.trim() === '')) {
        errors.push('GST number is required for bills over ₹500');
    }

    // Check items
    if (!billData.items || billData.items.length === 0) {
        errors.push('No items found in the bill');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Comprehensive bill validation
 * @param {Object} billData - Extracted bill data
 * @returns {Object} - { isValid: boolean, mathErrors: string[], formatErrors: string[], dateError: string, warnings: string[] }
 */
export function validateBill(billData) {
    const mathValidation = validateBillMath(billData);
    const formatValidation = validateBillFormat(billData);
    const dateValidation = validateBillDate(billData.billDate);

    const warnings = [];
    
    // Check price reasonability for all items
    if (billData.items) {
        billData.items.forEach(item => {
            const priceCheck = validatePriceReasonability(item.price, item.name);
            if (priceCheck.warning) {
                warnings.push(priceCheck.warning);
            }
        });
    }

    return {
        isValid: mathValidation.isValid && formatValidation.isValid && dateValidation.isValid,
        mathErrors: mathValidation.errors,
        formatErrors: formatValidation.errors,
        dateError: dateValidation.error,
        warnings
    };
}
