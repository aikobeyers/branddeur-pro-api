import mongoose from 'mongoose';

const gebouwSchema = new mongoose.Schema({
    name: { type: String, required: true },
    floor: [{ type: String }],
    location: [{ type: String }],
});

export default mongoose.model('Gebouw', gebouwSchema, 'gebouwen');
