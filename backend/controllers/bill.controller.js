import multer from 'multer';
import { extractBillData } from '../services/billExtraction.service.js';
import { detectFraud } from '../services/fraudDetection.service.js';
import { uploadBillImage } from '../services/supabase.service.js';
import { generateHash } from '../utils/hashGenerator.js';
import BillUpload from '../models/BillUpload.js';
import User from '../models/User.js';
import Grant from '../models/Grant.js';
import { deductGrantBalance } from '../services/grant.service.js';
import { sendBillApprovalEmail, sendBillRejectionEmail } from '../services/email.service.js';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

export const uploadMiddleware = upload.array('bills', 10); // Max 10 bills at once

/**
 * Upload bill(s) and process asynchronously
 * POST /api/bills/upload
 */
export async function uploadBill(req, res) {
    try {
        const userId = req.userId; // From auth middleware
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        // Verify user exists
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get or create BillUpload document for user
        let billUploadDoc = await BillUpload.findOne({ userId: user._id });
        if (!billUploadDoc) {
            billUploadDoc = new BillUpload({ userId: user._id, bills: [] });
        }

        // Get grantId from request body (sent by student)
        const grantId = req.body.grantId;
        console.log(`[uploadBill] Received upload request from user ${userId}`);
        console.log(`[uploadBill] GrantId from body: ${grantId}`);

        // Process each file
        const uploadResults = [];
        const billsToProcess = []; // Store bills for async processing

        for (const file of files) {
            try {
                // Generate hash for duplicate detection
                const billHash = generateHash(file.buffer);

                // Upload to Supabase - use user.id for correct path structure
                const uploadResult = await uploadBillImage(file.buffer, file.originalname, user.id);
                
                if (!uploadResult.success) {
                    uploadResults.push({
                        fileName: file.originalname,
                        success: false,
                        error: uploadResult.error
                    });
                    continue;
                }

                // Create bill entry with pending status and grantId
                const billEntry = {
                    imageUrl: uploadResult.url,
                    billHash,
                    status: 'pending',
                    uploadedAt: new Date(),
                    grantId: grantId || null, // Link to grant if provided
                    approvalStatus: 'pending' // Default approval status
                };
                
                console.log(`[uploadBill] Creating bill entry with grantId: ${billEntry.grantId}`);

                billUploadDoc.bills.push(billEntry);
                
                // Store file info for async processing (will get ID after save)
                billsToProcess.push({
                    fileName: file.originalname,
                    buffer: file.buffer,
                    mimetype: file.mimetype,
                    billHash,
                    imageUrl: uploadResult.url
                });

            } catch (error) {
                console.error(`Error processing file ${file.originalname}:`, error);
                uploadResults.push({
                    fileName: file.originalname,
                    success: false,
                    error: error.message
                });
            }
        }

        // Save document to generate _id for subdocuments
        await billUploadDoc.save();

        // Now get the generated IDs and start async processing
        const savedBills = billUploadDoc.bills.slice(-billsToProcess.length); // Get last N bills
        
        for (let i = 0; i < billsToProcess.length; i++) {
            const billInfo = billsToProcess[i];
            const savedBill = savedBills[i];
            
            uploadResults.push({
                fileName: billInfo.fileName,
                success: true,
                billId: savedBill._id.toString(),
                imageUrl: billInfo.imageUrl
            });

            // Process asynchronously (don't await)
            processBillAsync(
                billUploadDoc._id, 
                savedBill._id, 
                billInfo.buffer, 
                billInfo.mimetype, 
                billInfo.billHash, 
                user._id.toString()
            );
        }

        res.status(202).json({
            message: 'Bills uploaded successfully. Processing in background.',
            results: uploadResults
        });

    } catch (error) {
        console.error('Upload bill error:', error);
        res.status(500).json({ error: 'Failed to upload bills' });
    }
}

/**
 * Process bill asynchronously (extraction + fraud detection)
 */
async function processBillAsync(docId, billId, imageBuffer, mimeType, billHash, userId) {
    try {
        // Update status to processing
        await BillUpload.updateOne(
            { _id: docId, 'bills._id': billId },
            { $set: { 'bills.$.status': 'processing' } }
        );

        // Extract bill data
        const extractionResult = await extractBillData(imageBuffer, mimeType);
        
        if (!extractionResult.success) {
            await BillUpload.updateOne(
                { _id: docId, 'bills._id': billId },
                { 
                    $set: { 
                        'bills.$.status': 'failed',
                        'bills.$.errorMessage': extractionResult.error
                    } 
                }
            );
            return;
        }

        const extractedData = extractionResult.data;

        // Detect fraud
        const fraudResult = await detectFraud(imageBuffer, extractedData, billHash, userId, mimeType);
        
        if (!fraudResult.success) {
            // Still save extracted data even if fraud detection fails
            await BillUpload.updateOne(
                { _id: docId, 'bills._id': billId },
                { 
                    $set: { 
                        'bills.$.status': 'completed',
                        'bills.$.extractedData': extractedData,
                        'bills.$.fraudAnalysis': {
                            score: 50,
                            flags: ['FRAUD_CHECK_FAILED'],
                            warnings: [fraudResult.error],
                            validations: {}
                        }
                    } 
                }
            );
            return;
        }

        // Update with complete analysis
        await BillUpload.updateOne(
            { _id: docId, 'bills._id': billId },
            { 
                $set: { 
                    'bills.$.status': 'completed',
                    'bills.$.extractedData': extractedData,
                    'bills.$.fraudAnalysis': fraudResult.fraudAnalysis
                } 
            }
        );

        console.log(`Bill ${billId} processed successfully`);

    } catch (error) {
        console.error(`Error processing bill ${billId}:`, error);
        await BillUpload.updateOne(
            { _id: docId, 'bills._id': billId },
            { 
                $set: { 
                    'bills.$.status': 'failed',
                    'bills.$.errorMessage': error.message
                } 
            }
        );
    }
}

/**
 * Get bill analysis by bill ID
 * GET /api/bills/:billId
 */
export async function getBillAnalysis(req, res) {
    try {
        const userId = req.userId;
        const { billId } = req.params;
        console.log("userid: ", userId);
        console.log("billid: ", billId);
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const billUploadDoc = await BillUpload.findOne({
            userId: user._id,
            'bills._id': billId
        });

        if (!billUploadDoc) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        const bill = billUploadDoc.bills.id(billId);

        res.json({
            billId: bill._id,
            imageUrl: bill.imageUrl,
            status: bill.status,
            extractedData: bill.extractedData,
            fraudAnalysis: bill.fraudAnalysis,
            uploadedAt: bill.uploadedAt,
            errorMessage: bill.errorMessage
        });

    } catch (error) {
        console.error('Get bill analysis error:', error);
        res.status(500).json({ error: 'Failed to get bill analysis' });
    }
}

/**
 * Get all bills for authenticated user
 * GET /api/bills
 */
export async function getUserBills(req, res) {
    try {
        const userId = req.userId;
        const { status, limit = 50, skip = 0 } = req.query;

        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const billUploadDoc = await BillUpload.findOne({ userId: user._id });

        if (!billUploadDoc) {
            return res.json({ bills: [], total: 0 });
        }

        let bills = billUploadDoc.bills;

        // Filter by status if provided
        if (status) {
            bills = bills.filter(b => b.status === status);
        }

        // Sort by upload date (newest first)
        bills.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

        // Pagination
        const total = bills.length;
        const paginatedBills = bills.slice(parseInt(skip), parseInt(skip) + parseInt(limit));

        res.json({
            bills: paginatedBills.map(b => ({
                billId: b._id,
                imageUrl: b.imageUrl,
                status: b.status,
                extractedData: b.extractedData,
                fraudAnalysis: b.fraudAnalysis,
                uploadedAt: b.uploadedAt,
                errorMessage: b.errorMessage,
                approvalStatus: b.approvalStatus || 'pending',
                rejectionReason: b.rejectionReason
            })),
            total,
            limit: parseInt(limit),
            skip: parseInt(skip)
        });

    } catch (error) {
        console.error('Get user bills error:', error);
        res.status(500).json({ error: 'Failed to get bills' });
    }
}

/**
 * Delete bill
 * DELETE /api/bills/:billId
 */
export async function deleteBill(req, res) {
    try {
        const userId = req.userId;
        const { billId } = req.params;

        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const billUploadDoc = await BillUpload.findOne({
            userId: user._id,
            'bills._id': billId
        });

        if (!billUploadDoc) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        // Remove bill from array
        billUploadDoc.bills.pull(billId);
        await billUploadDoc.save();

        res.json({ message: 'Bill deleted successfully' });

    } catch (error) {
        console.error('Delete bill error:', error);
        res.status(500).json({ error: 'Failed to delete bill' });
    }
}

/**
 * Approve bill (faculty only)
 * PATCH /api/bills/:billId/approve
 */
export async function approveBill(req, res) {
    try {
        const userId = req.userId;
        const { billId } = req.params;

        // Get faculty user
        const faculty = await User.findOne({ id: userId });
        if (!faculty) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Find bill
        const billUploadDoc = await BillUpload.findOne({ 'bills._id': billId });
        if (!billUploadDoc) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        const bill = billUploadDoc.bills.id(billId);
        if (!bill) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        // Check if bill is already approved or rejected
        if (bill.approvalStatus !== 'pending') {
            return res.status(400).json({ error: `Bill is already ${bill.approvalStatus}` });
        }

        // Verify faculty owns the grant
        if (!bill.grantId) {
            return res.status(400).json({ error: 'Bill is not linked to a grant' });
        }

        const grant = await Grant.findById(bill.grantId);
        if (!grant) {
            return res.status(404).json({ error: 'Grant not found' });
        }

        if (grant.facultyId.toString() !== faculty._id.toString()) {
            return res.status(403).json({ error: 'Unauthorized: You are not the faculty for this grant' });
        }

        // Check if bill amount exceeds remaining grant balance
        const billAmount = bill.extractedData?.total || 0;
        if (!grant.hasSufficientBalance(billAmount)) {
            return res.status(400).json({ 
                error: 'Insufficient grant balance',
                remainingBalance: grant.remainingAmount,
                billAmount
            });
        }

        // Update bill status
        bill.approvalStatus = 'approved';
        bill.approvedBy = faculty._id;
        bill.approvedAt = new Date();
        await billUploadDoc.save();

        // Deduct from grant balance
        const deductResult = await deductGrantBalance(grant._id.toString(), billAmount);
        if (!deductResult.success) {
            // Rollback bill approval
            bill.approvalStatus = 'pending';
            bill.approvedBy = null;
            bill.approvedAt = null;
            await billUploadDoc.save();
            return res.status(400).json({ error: deductResult.error });
        }

        // Get student info
        const student = await User.findById(billUploadDoc.userId);

        // Send approval email
        if (student) {
            await sendBillApprovalEmail({
                studentEmail: student.email,
                billAmount,
                remainingBalance: deductResult.grant.remainingAmount,
                facultyName: faculty.name || faculty.email
            });
        }

        res.json({
            message: 'Bill approved successfully',
            bill: {
                billId: bill._id,
                approvalStatus: bill.approvalStatus,
                approvedAt: bill.approvedAt
            },
            grant: {
                remainingAmount: deductResult.grant.remainingAmount,
                usedAmount: deductResult.grant.usedAmount
            }
        });

    } catch (error) {
        console.error('Approve bill error:', error);
        res.status(500).json({ error: 'Failed to approve bill' });
    }
}

/**
 * Reject bill (faculty only)
 * PATCH /api/bills/:billId/reject
 */
export async function rejectBill(req, res) {
    try {
        const userId = req.userId;
        const { billId } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ error: 'Rejection reason is required' });
        }

        // Get faculty user
        const faculty = await User.findOne({ id: userId });
        if (!faculty) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Find bill
        const billUploadDoc = await BillUpload.findOne({ 'bills._id': billId });
        if (!billUploadDoc) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        const bill = billUploadDoc.bills.id(billId);
        if (!bill) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        // Check if bill is already approved or rejected
        if (bill.approvalStatus !== 'pending') {
            return res.status(400).json({ error: `Bill is already ${bill.approvalStatus}` });
        }

        // Verify faculty owns the grant
        if (!bill.grantId) {
            return res.status(400).json({ error: 'Bill is not linked to a grant' });
        }

        const grant = await Grant.findById(bill.grantId);
        if (!grant) {
            return res.status(404).json({ error: 'Grant not found' });
        }

        if (grant.facultyId.toString() !== faculty._id.toString()) {
            return res.status(403).json({ error: 'Unauthorized: You are not the faculty for this grant' });
        }

        // Update bill status
        bill.approvalStatus = 'rejected';
        bill.approvedBy = faculty._id;
        bill.approvedAt = new Date();
        bill.rejectionReason = reason;
        await billUploadDoc.save();

        // Get student info
        const student = await User.findById(billUploadDoc.userId);

        // Send rejection email
        if (student) {
            await sendBillRejectionEmail({
                studentEmail: student.email,
                billAmount: bill.extractedData?.total || 0,
                rejectionReason: reason,
                facultyName: faculty.name || faculty.email
            });
        }

        res.json({
            message: 'Bill rejected successfully',
            bill: {
                billId: bill._id,
                approvalStatus: bill.approvalStatus,
                rejectionReason: bill.rejectionReason
            }
        });

    } catch (error) {
        console.error('Reject bill error:', error);
        res.status(500).json({ error: 'Failed to reject bill' });
    }
}

/**
 * Get bills for a specific grant (faculty only)
 * GET /api/bills/grant/:grantId
 */
export async function getGrantBills(req, res) {
    try {
        const userId = req.userId;
        const { grantId } = req.params;

        console.log(`[getGrantBills] Request for grantId: ${grantId} by faculty: ${userId}`);

        // Verify user is faculty
        const user = await User.findOne({ id: userId });
        if (!user) {
            console.log('[getGrantBills] User not found');
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify grant exists and belongs to this faculty
        const grant = await Grant.findById(grantId);
        if (!grant) {
            console.log('[getGrantBills] Grant not found');
            return res.status(404).json({ error: 'Grant not found' });
        }

        if (grant.facultyId.toString() !== user._id.toString()) {
            console.log(`[getGrantBills] Unauthorized: Grant faculty ${grant.facultyId} !== User ${user._id}`);
            return res.status(403).json({ error: 'Unauthorized access to this grant' });
        }

        // Get student's bills
        if (!grant.studentId) {
            console.log('[getGrantBills] Grant has no studentId');
            return res.json({ bills: [], total: 0 });
        }

        console.log(`[getGrantBills] Looking for bills for student: ${grant.studentId}`);
        const billUploadDoc = await BillUpload.findOne({ userId: grant.studentId });

        if (!billUploadDoc) {
            console.log('[getGrantBills] No BillUpload document found for student');
            return res.json({ bills: [], total: 0 });
        }

        console.log(`[getGrantBills] Found BillUpload doc with ${billUploadDoc.bills.length} bills`);

        // Filter bills for this grant
        const bills = billUploadDoc.bills.filter(b => {
            const billGrantId = b.grantId ? b.grantId.toString() : 'null';
            const match = b.grantId && b.grantId.toString() === grantId;
            console.log(`[getGrantBills] Checking bill ${b._id}: billGrantId=${billGrantId} reqGrantId=${grantId} match=${match}`);
            return match;
        });

        console.log(`[getGrantBills] Returning ${bills.length} bills for grant ${grantId}`);

        // Sort by upload date (newest first)
        bills.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

        res.json({
            bills: bills.map(b => ({
                billId: b._id,
                imageUrl: b.imageUrl,
                status: b.status,
                uploadedAt: b.uploadedAt,
                extractedData: b.extractedData,
                fraudAnalysis: b.fraudAnalysis, // Faculty can see fraud analysis
                approvalStatus: b.approvalStatus || 'pending',
                approvedBy: b.approvedBy,
                approvedAt: b.approvedAt,
                rejectionReason: b.rejectionReason,
                grantId: b.grantId
            })),
            total: bills.length
        });

    } catch (error) {
        console.error('Get grant bills error:', error);
        res.status(500).json({ error: 'Failed to get grant bills' });
    }
}

export default {
    uploadMiddleware,
    uploadBill,
    getBillAnalysis,
    getUserBills,
    deleteBill,
    approveBill,
    rejectBill,
    getGrantBills
};
