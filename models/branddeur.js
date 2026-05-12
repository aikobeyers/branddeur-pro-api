import mongoose from 'mongoose';

const branddeurSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mostRecentInspection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BranddeurInspectie',
    },
    doorType: { type: String },
    resistanceMinutes: { type: Number },
    building: { type: String },
    floor: { type: String },
    location: { type: String },
    manufacturer: { type: String },
});

export default mongoose.model('Branddeur', branddeurSchema, 'branddeuren');
