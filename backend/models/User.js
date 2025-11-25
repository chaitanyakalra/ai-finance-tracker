import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    googleId: { type: String, unique: true, sparse: true },
    email: { type: String, required: true, unique: true },
    name: { type: String },
    profilePic: { type: String },
    role: { type: String, default: 'user' },
    isTeacher: { type: Boolean, default: false },
    isStudent: { type: Boolean, default: false },
    hasAwardedGrant: { type: Boolean, default: false },
    hasReceivedGrant: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
