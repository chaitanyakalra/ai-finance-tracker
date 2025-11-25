import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Convert buffer to Gemini-compatible format
 * @param {Buffer} buffer - Image buffer
 * @param {string} mimeType - MIME type
 * @returns {Object} - Gemini image format
 */
function bufferToGenerativePart(buffer, mimeType) {
    return {
        inlineData: {
            data: buffer.toString('base64'),
            mimeType
        }
    };
}

/**
 * Extract bill data using Gemini Vision API
 * @param {Buffer} imageBuffer - Bill image buffer
 * @param {string} mimeType - Image MIME type
 * @returns {Promise<Object>} - Extracted bill data
 */
export async function extractBillData(imageBuffer, mimeType = 'image/jpeg') {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const prompt = `You are an expert at extracting data from Indian bills and invoices. Analyze this bill image and extract the following information in JSON format:

{
  "merchantName": "Name of the merchant/store",
  "gstNumber": "GST number if present (15 characters)",
  "billNumber": "Bill/Invoice number",
  "billDate": "Date in YYYY-MM-DD format",
  "items": [
    {
      "name": "Item name",
      "quantity": number,
      "price": number (price per unit),
      "total": number (total for this item)
    }
  ],
  "subtotal": number (sum of all items before tax),
  "tax": number (tax amount),
  "taxPercentage": number (GST percentage, e.g., 18 for 18%),
  "total": number (final total amount),
  "paymentMethod": "Payment method if mentioned (Cash/Card/UPI/etc)"
}

IMPORTANT RULES:
1. Extract ALL items from the bill
2. Ensure mathematical accuracy - verify that item totals = quantity × price
3. If GST is mentioned, extract the percentage
4. If any field is not found, use null for strings or 0 for numbers
5. Return ONLY valid JSON, no additional text
6. For dates, convert to YYYY-MM-DD format
7. All amounts should be numbers without currency symbols

Analyze the bill carefully and return the JSON:`;

        const imagePart = bufferToGenerativePart(imageBuffer, mimeType);
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response (remove markdown code blocks if present)
        let jsonText = text.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\n?/g, '');
        }

        const extractedData = JSON.parse(jsonText);

        return {
            success: true,
            data: extractedData,
            error: null
        };
    } catch (error) {
        console.error('Bill extraction error:', error);
        return {
            success: false,
            data: null,
            error: error.message || 'Failed to extract bill data'
        };
    }
}

/**
 * Analyze bill for fraud using Gemini AI
 * @param {Buffer} imageBuffer - Bill image buffer
 * @param {Object} extractedData - Previously extracted bill data
 * @param {string} mimeType - Image MIME type
 * @returns {Promise<Object>} - Fraud analysis
 */
export async function analyzeBillForFraud(imageBuffer, extractedData, mimeType = 'image/jpeg') {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const prompt = `You are an expert fraud detection analyst for Indian bills and invoices. Analyze this bill image for potential fraud indicators.

Previously extracted data:
${JSON.stringify(extractedData, null, 2)}

Analyze the bill for the following fraud indicators:

1. **Visual Tampering**: Look for signs of image editing, inconsistent fonts, misaligned text, blurry regions, or copy-paste artifacts
2. **Logical Inconsistencies**: Check for unrealistic prices, unusual merchant names, suspicious patterns
3. **Format Anomalies**: Verify if the bill format looks professional and legitimate
4. **Mathematical Accuracy**: Verify all calculations are correct
5. **GST Compliance**: Check if GST number format looks valid and if GST is required for this amount

Return your analysis in JSON format:
{
  "fraudScore": number (0-100, where 0 is completely safe and 100 is highly suspicious),
  "visualTampering": {
    "detected": boolean,
    "details": "Description of any visual tampering found"
  },
  "logicalIssues": [
    "List of any logical inconsistencies found"
  ],
  "formatIssues": [
    "List of any format problems"
  ],
  "overallAssessment": "Brief summary of fraud risk",
  "recommendations": "What actions should be taken"
}

Return ONLY valid JSON, no additional text.`;

        const imagePart = bufferToGenerativePart(imageBuffer, mimeType);
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response
        let jsonText = text.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\n?/g, '');
        }

        const fraudAnalysis = JSON.parse(jsonText);

        return {
            success: true,
            analysis: fraudAnalysis,
            error: null
        };
    } catch (error) {
        console.error('Fraud analysis error:', error);
        return {
            success: false,
            analysis: null,
            error: error.message || 'Failed to analyze bill for fraud'
        };
    }
}

export default {
    extractBillData,
    analyzeBillForFraud
};
