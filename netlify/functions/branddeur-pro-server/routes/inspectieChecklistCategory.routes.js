import express from 'express';
import InspectieChecklistCategory from '../../../../models/inspectieChecklistCategory.js';
import connectToDatabase from '../../../../lib/db.js';

const router = express.Router();

// Get all inspectie checklist categories
router.get('/', async (req, res) => {
    try {
        await connectToDatabase();
        const categories = await InspectieChecklistCategory.find();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get a single inspectie checklist category by ID
router.get('/:id', async (req, res) => {
    try {
        await connectToDatabase();
        const category = await InspectieChecklistCategory.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.json(category);
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Create a new inspectie checklist category
router.post('/', async (req, res) => {
    try {
        await connectToDatabase();
        const { code, value } = req.body;
        if (!code || !value) {
            return res.status(400).json({ message: 'Code and value are required' });
        }
        const newCategory = new InspectieChecklistCategory({ code, value });
        const savedCategory = await newCategory.save();
        res.status(201).json(savedCategory);
    } catch (err) {
        res.status(400).json({ message: 'Bad Request. ' + err.message });
    }
});

// Update an inspectie checklist category
router.put('/:id', async (req, res) => {
    try {
        await connectToDatabase();
        const { code, value } = req.body;
        const updatedCategory = await InspectieChecklistCategory.findByIdAndUpdate(
            req.params.id,
            { code, value },
            { new: true, runValidators: true }
        );
        if (!updatedCategory) return res.status(404).json({ message: 'Category not found' });
        res.json(updatedCategory);
    } catch (err) {
        res.status(400).json({ message: 'Bad Request. ' + err.message });
    }
});

// Delete an inspectie checklist category
router.delete('/:id', async (req, res) => {
    try {
        await connectToDatabase();
        const deletedCategory = await InspectieChecklistCategory.findByIdAndDelete(req.params.id);
        if (!deletedCategory) return res.status(404).json({ message: 'Category not found' });
        res.json({ message: 'Category deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
