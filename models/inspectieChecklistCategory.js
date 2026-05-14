import mongoose from 'mongoose';

const inspectieChecklistCategorySchema = new mongoose.Schema({
    code: { type: String, required: true },
    value: { type: String, required: true },
});

export default mongoose.model('InspectieChecklistCategory', inspectieChecklistCategorySchema, 'inspectieChecklistCategories');