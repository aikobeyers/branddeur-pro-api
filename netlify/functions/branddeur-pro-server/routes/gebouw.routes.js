import express from 'express';
import Gebouw from '../../../../models/gebouw.js';
import connectToDatabase from '../../../../lib/db.js';

const router = express.Router();

// Get all gebouwen
router.get('/', async (req, res) => {
    try {
        await connectToDatabase();
        const gebouwen = await Gebouw.find();
        res.json(gebouwen);
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get a single gebouw by ID
router.get('/:id', async (req, res) => {
    try {
        await connectToDatabase();
        const gebouw = await Gebouw.findById(req.params.id);
        if (!gebouw) return res.status(404).json({ message: 'Gebouw not found' });
        res.json(gebouw);
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Create a new gebouw
router.post('/', async (req, res) => {
    try {
        await connectToDatabase();
        const { name, floor, location } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Gebouw name is required' });
        }
        const gebouw = new Gebouw({ name, floor, location });
        const newGebouw = await gebouw.save();
        res.status(201).json(newGebouw);
    } catch (err) {
        res.status(400).json({ message: 'Bad Request. ' + err.message });
    }
});

// Update a gebouw
router.put('/:id', async (req, res) => {
    try {
        await connectToDatabase();
        if (!req.params.id) {
            return res.status(400).json({ message: 'Gebouw ID is required' });
        }
        const allowedFields = ['name', 'floor', 'location'];
        const updatePayload = {};
        for (const field of allowedFields) {
            if (field in req.body) {
                updatePayload[field] = req.body[field];
            }
        }
        const gebouw = await Gebouw.findByIdAndUpdate(req.params.id, { $set: updatePayload }, { new: true, runValidators: true });
        res.json(gebouw);
    } catch (err) {
        res.status(400).json({ message: 'Bad Request. ' + err.message });
    }
});

// Delete a gebouw
router.delete('/:id', async (req, res) => {
    try {
        await connectToDatabase();
        const gebouw = await Gebouw.findByIdAndDelete(req.params.id);
        if (!gebouw) return res.status(404).json({ message: 'Gebouw not found' });
        res.json({ message: 'Gebouw deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
