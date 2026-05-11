import mongoose from 'mongoose';

const inspectieChecklistItemSchema = new mongoose.Schema({
    displayValue: { type: String },
    damageCheck: { type: Boolean },
});

export default mongoose.model('InspectieChecklistItem', inspectieChecklistItemSchema, 'inspectieChecklistItems');
