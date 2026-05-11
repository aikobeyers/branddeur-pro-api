import mongoose from 'mongoose';

const STATUS_OPTIONS = {
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

const branddeurSchema = new mongoose.Schema({
    name: { type: String, required: true },
    status: {
        type: statusSchema,
        validate: {
            validator: (value) => {
                if (!value) {
                    return true;
                }
                return STATUS_OPTIONS[value.statusCode] === value.statusValue;
            },
            message: 'Invalid status combination. Use A/Goedgekeurd, B/Herstel nodig, or C/Afgekeurd.',
        },
    },
    doorType: { type: String },
    resistanceMinutes: { type: Number },
    building: { type: String },
    floor: { type: String },
    location: { type: String },
    nextInspectionDate: { type: Date },
    manufacturer: { type: String },
});

export default mongoose.model('Branddeur', branddeurSchema, 'branddeuren');
