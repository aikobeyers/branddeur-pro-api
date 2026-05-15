import express from 'express';
import InspectieChecklistItem from '../../../../models/inspectieChecklistItem.js';
import connectToDatabase from '../../../../lib/db.js';

const router = express.Router();

// Get all inspectie checklist items
router.get('/', async (req, res) => {
    try {
        await connectToDatabase();
        const inspectieChecklistItems = await InspectieChecklistItem.find().populate('category');
        res.json(inspectieChecklistItems);
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Bulk create inspectie checklist items
router.post('/', async (req, res) => {
    try {
        await connectToDatabase();
        const items = Array.isArray(req.body) ? req.body : [req.body];
        for (const item of items) {
            if (!item.displayValue || !item.category) {
                return res.status(400).json({ message: 'Each item must have displayValue and category' });
            }
        }
        const createdItems = await InspectieChecklistItem.insertMany(items);
        res.status(201).json(createdItems);
    } catch (err) {
        res.status(400).json({ message: 'Bad Request. ' + err.message });
    }
});

export default router;
