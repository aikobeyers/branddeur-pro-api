import mongoose from 'mongoose';

const branddeurSchema = new mongoose.Schema({
    name: { type: String, required: true },
});

export default mongoose.model('Branddeur', branddeurSchema, 'branddeuren');
