import mongoose from 'mongoose';

const checkListItemResultSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InspectieChecklistItem',
        required: true,
    },
    value: {
        type: Boolean,
        required: true,
    },
}, { _id: false });

const branddeurInspectieSchema = new mongoose.Schema({
    branddeurId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branddeur',
        required: true,
    },
    checkListItems: {
        type: [checkListItemResultSchema],
        default: [],
    },
}, {
    timestamps: true,
});

export default mongoose.model('BranddeurInspectie', branddeurInspectieSchema, 'branddeurInspecties');
