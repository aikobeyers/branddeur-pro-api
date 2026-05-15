import express from 'express';
import Branddeur from '../../../../models/branddeur.js';
import connectToDatabase from '../../../../lib/db.js';
import verifyToken from '../../../../middleware/authMiddleware.js';

const router = express.Router();

// Get all branddeuren
router.get('/', async (req, res) => {
    try {
        await connectToDatabase();
        const branddeurs = await Branddeur.find().populate('mostRecentInspection');
        res.json(branddeurs);
    } catch (err) {
        res.status(500).json({message: 'Internal Server Error'});
    }
});

// Get a single branddeur by ID
router.get('/:id', async (req, res) => {
    try {
        await connectToDatabase();
        const branddeur = await Branddeur.findById(req.params.id).populate('mostRecentInspection');
        if (!branddeur) return res.status(404).json({message: 'Branddeur not found'});
        res.json(branddeur);
    } catch (err) {
        res.status(500).json({message: 'Internal Server Error'});
    }
});

// Create a new branddeur
router.post('/', async (req, res) => {
    try {
        await connectToDatabase();
        const { name, doorType, resistanceMinutes, building, floor, location, initialInspectionDate, manufacturer } = req.body;
        if (!name) {
            return res.status(400).json({message: 'Branddeur name is required'});
        }
        const branddeur = new Branddeur({ name, doorType, resistanceMinutes, building, floor, location, initialInspectionDate, manufacturer });
        const newBranddeur = await branddeur.save();
        res.status(201).json(newBranddeur);
    } catch (err) {
        res.status(400).json({message: 'Bad Request. ' + err.message});
    }
});

// Update a branddeur
router.put('/:id', async (req, res) => {
    try {
        await connectToDatabase();
        if (!req.params.id) {
            return res.status(400).json({message: 'Branddeur ID is required'});
        }
        const allowedFields = ['name', 'doorType', 'resistanceMinutes', 'building', 'floor', 'location', 'manufacturer', 'initialInspectionDate'];
        const updatePayload = {};
        for (const field of allowedFields) {
            if (field in req.body) {
                updatePayload[field] = req.body[field];
            }
        }
        const branddeur = await Branddeur.findByIdAndUpdate(req.params.id, { $set: updatePayload }, { new: true, runValidators: true });
        res.json(branddeur);
    } catch (err) {
        res.status(400).json({message: 'Bad Request. ' + err.message});
    }
});

// Delete a branddeur
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await connectToDatabase();
        const branddeur = await Branddeur.findByIdAndDelete(req.params.id);
        if (!branddeur) return res.status(404).json({message: 'Branddeur not found'});
        res.json({message: 'Branddeur deleted'});
    } catch (err) {
        res.status(500).json({message: 'Internal Server Error'});
    }
});

export default router;
