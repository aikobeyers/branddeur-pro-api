import mongoose from 'mongoose';

const inspectieChecklistItemSchema = new mongoose.Schema({
    displayValue: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'InspectieChecklistCategory', required: true },
});

export default mongoose.model('InspectieChecklistItem', inspectieChecklistItemSchema, 'inspectieChecklistItems');
