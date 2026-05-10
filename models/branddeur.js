import mongoose from 'mongoose';

const branddeurSchema = new mongoose.Schema({
    name: { type: String, required: true },
    status: { type: String },
    doorType: { type: String },
    resistanceMinutes: { type: Number },
    building: { type: String },
    floor: { type: String },
    location: { type: String },
    nextInspectionDate: { type: Date },
    manufacturer: { type: String },
});

export default mongoose.model('Branddeur', branddeurSchema, 'branddeuren');
