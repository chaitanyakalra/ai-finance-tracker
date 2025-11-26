import mongoose from 'mongoose';

const billItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    total: { type: Number, required: true }
}, { _id: false });

const fraudAnalysisSchema = new mongoose.Schema({
    score: { type: Number, required: true, min: 0, max: 100 }, // 0 = safe, 100 = highly suspicious
    flags: [{ type: String }], // Array of fraud flags (e.g., "MATH_MISMATCH", "INVALID_GST")
    warnings: [{ type: String }], // Array of warning messages
    aiAnalysis: { type: mongoose.Schema.Types.Mixed }, // Full Gemini AI analysis object
    validations: {
        gstValid: { type: Boolean },
        mathValid: { type: Boolean },
        dateValid: { type: Boolean },
        isDuplicate: { type: Boolean }
    }
}, { _id: false });

const extractedDataSchema = new mongoose.Schema({
    merchantName: { type: String },
    gstNumber: { type: String },
    billNumber: { type: String },
    billDate: { type: Date },
    items: [billItemSchema],
    subtotal: { type: Number },
    tax: { type: Number },
    taxPercentage: { type: Number },
    total: { type: Number },
    paymentMethod: { type: String }
}, { _id: false });

const billSchema = new mongoose.Schema({
    imageUrl: { type: String, required: true },
    extractedData: extractedDataSchema,
    fraudAnalysis: fraudAnalysisSchema,
    billHash: { type: String, required: true }, // For duplicate detection
    status: { 
        type: String, 
        enum: ['pending', 'processing', 'completed', 'failed'], 
        default: 'pending' 
    },
    // Grant and approval fields
    grantId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Grant',
        default: null
    },
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    approvedAt: {
        type: Date,
        default: null
    },
    rejectionReason: {
        type: String,
        default: null
    },
    errorMessage: { type: String },
    uploadedAt: { type: Date, default: Date.now }
}, { _id: true });

const billUploadSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true
    },
    bills: [billSchema]
}, { timestamps: true });

// Index for faster duplicate detection
billUploadSchema.index({ 'bills.billHash': 1 });

export default mongoose.model('BillUpload', billUploadSchema);
