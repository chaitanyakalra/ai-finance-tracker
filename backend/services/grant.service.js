const Expense = require('../models/Expense');

// Placeholder for OCR Service Integration (e.g., Tesseract.js or AWS Textract)
const processReceiptImage = async (imageUrl) => {
    // TODO: Implement AWS Lambda trigger for OCR processing
    console.log(`[GrantService] Triggering OCR for image: ${imageUrl}`);

    // Simulated delay and response
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                merchant: "Detected Merchant",
                date: new Date(),
                amount: 0.00,
                confidence: 0.85,
                status: "PENDING_VERIFICATION"
            });
        }, 1000);
    });
};

// Placeholder for AI Photo Scraping/Enrichment
const enrichReceiptData = async (ocrData) => {
    // TODO: Integrate with scraping service to validate merchant details
    console.log(`[GrantService] Enriching data for: ${ocrData.merchant}`);
    return {
        ...ocrData,
        category: "Uncategorized", // AI would determine this
        isGrantEligible: true // Logic to check against university rules
    };
};

const submitForGrant = async (userId, expenseId, receiptUrl) => {
    try {
        const ocrResult = await processReceiptImage(receiptUrl);
        const enrichedData = await enrichReceiptData(ocrResult);

        // Logic to update expense record with grant status
        // const expense = await Expense.findById(expenseId);
        // expense.grantStatus = 'SUBMITTED';
        // await expense.save();

        return {
            success: true,
            message: "Grant application submitted successfully",
            data: enrichedData
        };
    } catch (error) {
        console.error("[GrantService] Error submitting grant:", error);
        throw error;
    }
};

module.exports = {
    submitForGrant,
    processReceiptImage
};
