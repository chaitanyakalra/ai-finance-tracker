import { validateGST } from '../utils/gstValidator.js';
import { validateBill } from '../utils/billValidator.js';
import { analyzeBillForFraud } from './billExtraction.service.js';
import BillUpload from '../models/BillUpload.js';

/**
 * Comprehensive fraud detection combining AI analysis and rule-based validation
 * @param {Buffer} imageBuffer - Bill image buffer
 * @param {Object} extractedData - Extracted bill data
 * @param {string} billHash - Bill hash for duplicate detection
 * @param {string} userId - User ID
 * @param {string} mimeType - Image MIME type
 * @returns {Promise<Object>} - Fraud analysis results
 */
export async function detectFraud(imageBuffer, extractedData, billHash, userId, mimeType = 'image/jpeg') {
    try {
        const flags = [];
        const warnings = [];
        let fraudScore = 0;

        // 1. GEMINI AI ANALYSIS
        let aiAnalysis = null;
        const aiResult = await analyzeBillForFraud(imageBuffer, extractedData, mimeType);
        
        if (aiResult.success) {
            aiAnalysis = aiResult.analysis;
            fraudScore += aiAnalysis.fraudScore * 0.4; // AI contributes 40% to final score

            if (aiAnalysis.visualTampering?.detected) {
                flags.push('VISUAL_TAMPERING');
                warnings.push(`Visual tampering detected: ${aiAnalysis.visualTampering.details}`);
            }

            if (aiAnalysis.logicalIssues?.length > 0) {
                flags.push('LOGICAL_INCONSISTENCY');
                warnings.push(...aiAnalysis.logicalIssues);
            }

            if (aiAnalysis.formatIssues?.length > 0) {
                flags.push('FORMAT_ANOMALY');
                warnings.push(...aiAnalysis.formatIssues);
            }
        }

        // 2. RULE-BASED VALIDATION

        // GST Validation
        let gstValid = true;
        if (extractedData.gstNumber) {
            const gstValidation = validateGST(extractedData.gstNumber);
            gstValid = gstValidation.isValid;
            
            if (!gstValid) {
                flags.push('INVALID_GST');
                warnings.push(`GST validation failed: ${gstValidation.error}`);
                fraudScore += 20; // Invalid GST is serious
            }
        } else if (extractedData.total > 500) {
            // GST required for bills over ₹500
            flags.push('MISSING_GST');
            warnings.push('GST number missing for bill over ₹500');
            fraudScore += 15;
        }

        // Mathematical Validation
        const billValidation = validateBill(extractedData);
        const mathValid = billValidation.mathErrors.length === 0;
        
        if (!mathValid) {
            flags.push('MATH_MISMATCH');
            warnings.push(...billValidation.mathErrors);
            fraudScore += 25; // Math errors are highly suspicious
        }

        // Date Validation
        const dateValid = !billValidation.dateError;
        if (!dateValid) {
            flags.push('INVALID_DATE');
            warnings.push(billValidation.dateError);
            fraudScore += 10;
        }

        // Format Validation
        if (billValidation.formatErrors.length > 0) {
            flags.push('FORMAT_ERROR');
            warnings.push(...billValidation.formatErrors);
            fraudScore += 15;
        }

        // Add warnings for price issues
        if (billValidation.warnings.length > 0) {
            warnings.push(...billValidation.warnings);
            fraudScore += 5;
        }

        // 3. HISTORICAL ANALYSIS

        // Duplicate Detection
        const isDuplicate = await checkDuplicateBill(billHash, userId);
        if (isDuplicate) {
            flags.push('DUPLICATE_BILL');
            warnings.push('This bill has been uploaded before');
            fraudScore += 30; // Duplicates are very suspicious
        }

        // User Behavior Analysis
        const behaviorAnalysis = await analyzeUserBehavior(userId, extractedData);
        if (behaviorAnalysis.anomalyDetected) {
            flags.push('BEHAVIOR_ANOMALY');
            warnings.push(behaviorAnalysis.message);
            fraudScore += behaviorAnalysis.score;
        }

        // Pattern Anomalies
        const patternAnalysis = await detectPatternAnomalies(userId, extractedData);
        if (patternAnalysis.anomalyDetected) {
            flags.push('PATTERN_ANOMALY');
            warnings.push(patternAnalysis.message);
            fraudScore += patternAnalysis.score;
        }

        // Cap fraud score at 100
        fraudScore = Math.min(Math.round(fraudScore), 100);

        return {
            success: true,
            fraudAnalysis: {
                score: fraudScore,
                flags: [...new Set(flags)], // Remove duplicates
                warnings,
                aiAnalysis: aiAnalysis?.overallAssessment || null,
                validations: {
                    gstValid,
                    mathValid,
                    dateValid,
                    isDuplicate
                }
            },
            error: null
        };
    } catch (error) {
        console.error('Fraud detection error:', error);
        return {
            success: false,
            fraudAnalysis: null,
            error: error.message
        };
    }
}

/**
 * Check if bill is a duplicate
 * @param {string} billHash - Bill hash
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
async function checkDuplicateBill(billHash, userId) {
    try {
        const existingBill = await BillUpload.findOne({
            userId,
            'bills.billHash': billHash
        });

        return !!existingBill;
    } catch (error) {
        console.error('Duplicate check error:', error);
        return false;
    }
}

/**
 * Analyze user behavior for anomalies
 * @param {string} userId - User ID
 * @param {Object} extractedData - Bill data
 * @returns {Promise<Object>}
 */
async function analyzeUserBehavior(userId, extractedData) {
    try {
        // Get user's recent bills
        const userBills = await BillUpload.findOne({ userId });
        
        if (!userBills || userBills.bills.length < 3) {
            // Not enough data for behavior analysis
            return { anomalyDetected: false, message: '', score: 0 };
        }

        const recentBills = userBills.bills
            .filter(b => b.status === 'completed' && b.extractedData)
            .slice(-10); // Last 10 bills

        if (recentBills.length === 0) {
            return { anomalyDetected: false, message: '', score: 0 };
        }

        // Calculate average bill amount
        const avgAmount = recentBills.reduce((sum, b) => sum + (b.extractedData.total || 0), 0) / recentBills.length;

        // Check if current bill is significantly higher than average (3x or more)
        if (extractedData.total > avgAmount * 3 && avgAmount > 0) {
            return {
                anomalyDetected: true,
                message: `Bill amount (₹${extractedData.total}) is significantly higher than user's average (₹${avgAmount.toFixed(2)})`,
                score: 10
            };
        }

        // Check for rapid uploads (more than 5 bills in last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentUploads = userBills.bills.filter(b => new Date(b.uploadedAt) > oneHourAgo);
        
        if (recentUploads.length > 5) {
            return {
                anomalyDetected: true,
                message: 'Unusually high number of bills uploaded in short time',
                score: 15
            };
        }

        return { anomalyDetected: false, message: '', score: 0 };
    } catch (error) {
        console.error('Behavior analysis error:', error);
        return { anomalyDetected: false, message: '', score: 0 };
    }
}

/**
 * Detect pattern anomalies across user's bills
 * @param {string} userId - User ID
 * @param {Object} extractedData - Bill data
 * @returns {Promise<Object>}
 */
async function detectPatternAnomalies(userId, extractedData) {
    try {
        const userBills = await BillUpload.findOne({ userId });
        
        if (!userBills || userBills.bills.length < 5) {
            return { anomalyDetected: false, message: '', score: 0 };
        }

        const completedBills = userBills.bills
            .filter(b => b.status === 'completed' && b.extractedData);

        // Check for same merchant, same amount (potential duplicate with different image)
        const sameMerchantSameAmount = completedBills.filter(b => 
            b.extractedData.merchantName === extractedData.merchantName &&
            Math.abs(b.extractedData.total - extractedData.total) < 1
        );

        if (sameMerchantSameAmount.length > 0) {
            return {
                anomalyDetected: true,
                message: `Similar bill from ${extractedData.merchantName} with same amount already exists`,
                score: 20
            };
        }

        // Check for unusual merchant (if user has never uploaded from this merchant before)
        const merchantCounts = {};
        completedBills.forEach(b => {
            const merchant = b.extractedData.merchantName;
            merchantCounts[merchant] = (merchantCounts[merchant] || 0) + 1;
        });

        // If user has uploaded 10+ bills but this is first time from this merchant, flag it
        if (completedBills.length >= 10 && !merchantCounts[extractedData.merchantName]) {
            return {
                anomalyDetected: true,
                message: 'First bill from this merchant (user typically uploads from familiar merchants)',
                score: 5
            };
        }

        return { anomalyDetected: false, message: '', score: 0 };
    } catch (error) {
        console.error('Pattern analysis error:', error);
        return { anomalyDetected: false, message: '', score: 0 };
    }
}

export default {
    detectFraud
};
