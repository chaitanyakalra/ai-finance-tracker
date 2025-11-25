import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    googleId: { type: String, unique: true, sparse: true },
    email: { type: String, required: true, unique: true },
    name: { type: String },
    profilePic: { type: String },
    role: { type: String, default: 'user' },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
