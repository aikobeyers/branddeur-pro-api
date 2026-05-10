import mongoose from 'mongoose';

const branddeurSchema = new mongoose.Schema({
    name: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Branddeur', branddeurSchema);
