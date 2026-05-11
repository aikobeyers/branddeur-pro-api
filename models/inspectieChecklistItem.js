import mongoose from 'mongoose';

const inspectieChecklistItemSchema = new mongoose.Schema({
    displayValue: { type: String },
});

export default mongoose.model('InspectieChecklistItem', inspectieChecklistItemSchema, 'inspectieChecklistItems');
