import mongoose from 'mongoose';

export const STATUS_OPTIONS = {
    A: 'Goedgekeurd',
    B: 'Herstel nodig',
    C: 'Afgekeurd',
};

const statusSchema = new mongoose.Schema({
    statusCode: {
        type: String,
        enum: Object.keys(STATUS_OPTIONS),
        required: true,
    },
    statusValue: {
        type: String,
        enum: Object.values(STATUS_OPTIONS),
        required: true,
    },
}, { _id: false });

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
    foundProblems: {
        type: [String],
        default: [],
    },
    suggestedActions: {
        type: [String],
        default: [],
    },
    generalCondition: {
        type: String,
    },
    inspectionDate: {
        type: Date,
    },
    inspectionResult: {
        type: statusSchema,
        validate: {
            validator: (value) => {
                if (!value) {
                    return true;
                }
                return STATUS_OPTIONS[value.statusCode] === value.statusValue;
            },
            message: 'Invalid inspectionResult combination. Use A/Goedgekeurd, B/Herstel nodig, or C/Afgekeurd.',
        },
    },
    inspectionType: {
        type: String,
    },
    inspectorName: {
        type: String,
    },
    supervisor: {
        type: String,
    },
    nextInspection: {
        type: Date,
    },
}, {
    timestamps: true,
});

export default mongoose.model('BranddeurInspectie', branddeurInspectieSchema, 'branddeurInspecties');
