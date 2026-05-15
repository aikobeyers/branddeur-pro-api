import express from 'express';
import BranddeurInspectie, { STATUS_OPTIONS } from '../../../../models/branddeurInspectie.js';
import Branddeur from '../../../../models/branddeur.js';
import connectToDatabase from '../../../../lib/db.js';

const router = express.Router();

const normalizeCheckListItems = (checkListItems) => {
    if (!checkListItems) return [];
    if (Array.isArray(checkListItems)) return checkListItems;
    return Object.entries(checkListItems).map(([itemId, value]) => ({
        itemId,
        value: typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value),
    }));
};

const getNormalizedCheckListItemsFromBody = (body) => {
    const rawCheckListItems = body.checkListItems ?? body.checklistItems;
    if (rawCheckListItems === undefined) return undefined;
    return normalizeCheckListItems(rawCheckListItems);
};

const normalizeInspectionResult = (inspectionResult) => {
    if (inspectionResult === undefined) return undefined;
    if (inspectionResult === null) return null;
    if (typeof inspectionResult === 'object' && inspectionResult.statusCode && inspectionResult.statusValue) return inspectionResult;
    if (typeof inspectionResult === 'string') {
        if (STATUS_OPTIONS[inspectionResult]) {
            return { statusCode: inspectionResult, statusValue: STATUS_OPTIONS[inspectionResult] };
        }
        const statusCode = Object.entries(STATUS_OPTIONS).find(([, statusValue]) => statusValue === inspectionResult)?.[0];
        if (statusCode) {
            return { statusCode, statusValue: inspectionResult };
        }
    }
    return inspectionResult;
};

const syncMostRecentInspectionForBranddeur = async (branddeurId) => {
    if (!branddeurId) return;
    const latestInspection = await BranddeurInspectie.findOne({ branddeurId }).sort({ inspectionDate: -1, createdAt: -1 });
    await Branddeur.findByIdAndUpdate(branddeurId, { mostRecentInspection: latestInspection?._id ?? null });
};

// Get all branddeur inspecties
router.get('/', async (req, res) => {
    try {
        await connectToDatabase();
        const branddeurInspecties = await BranddeurInspectie.find().populate('branddeurId').populate('checkListItems.itemId');
        res.json(branddeurInspecties);
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get a single branddeur inspectie by ID
router.get('/:id', async (req, res) => {
    try {
        await connectToDatabase();
        const branddeurInspectie = await BranddeurInspectie.findById(req.params.id).populate('branddeurId').populate('checkListItems.itemId');
        if (!branddeurInspectie) return res.status(404).json({ message: 'Branddeur inspectie not found' });
        res.json(branddeurInspectie);
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Create a new branddeur inspectie
router.post('/', async (req, res) => {
    try {
        await connectToDatabase();
        const { branddeurId, foundProblems, suggestedActions, generalCondition, inspectionDate, inspectionResult, inspectionType, inspectorName, supervisor, nextInspection } = req.body;
        const normalizedCheckListItems = getNormalizedCheckListItemsFromBody(req.body);
        if (!branddeurId) {
            return res.status(400).json({ message: 'branddeurId is required' });
        }
        const branddeurInspectie = new BranddeurInspectie({
            branddeurId,
            checkListItems: normalizedCheckListItems ?? [],
            foundProblems,
            suggestedActions,
            generalCondition,
            inspectionDate,
            inspectionResult: normalizeInspectionResult(inspectionResult),
            inspectionType,
            inspectorName,
            supervisor,
            nextInspection,
        });
        const newBranddeurInspectie = await branddeurInspectie.save();
        await syncMostRecentInspectionForBranddeur(branddeurId);
        res.status(201).json(newBranddeurInspectie);
    } catch (err) {
        res.status(400).json({ message: 'Bad Request. ' + err.message });
    }
});

// Update a branddeur inspectie
router.put('/:id', async (req, res) => {
    try {
        await connectToDatabase();
        if (!req.params.id) {
            return res.status(400).json({ message: 'Branddeur inspectie ID is required' });
        }
        const existingBranddeurInspectie = await BranddeurInspectie.findById(req.params.id);
        if (!existingBranddeurInspectie) {
            return res.status(404).json({ message: 'Branddeur inspectie not found' });
        }
        const updatePayload = { ...req.body };
        const normalizedCheckListItems = getNormalizedCheckListItemsFromBody(req.body);
        if (normalizedCheckListItems !== undefined) {
            updatePayload.checkListItems = normalizedCheckListItems;
        }
        if (req.body.inspectionResult !== undefined) {
            updatePayload.inspectionResult = normalizeInspectionResult(req.body.inspectionResult);
        }
        delete updatePayload.checklistItems;
        const branddeurInspectie = await BranddeurInspectie.findByIdAndUpdate(req.params.id, updatePayload, { new: true, runValidators: true });
        await syncMostRecentInspectionForBranddeur(existingBranddeurInspectie.branddeurId);
        if (String(existingBranddeurInspectie.branddeurId) !== String(branddeurInspectie.branddeurId)) {
            await syncMostRecentInspectionForBranddeur(branddeurInspectie.branddeurId);
        }
        res.json(branddeurInspectie);
    } catch (err) {
        res.status(400).json({ message: 'Bad Request. ' + err.message });
    }
});

// Delete a branddeur inspectie
router.delete('/:id', async (req, res) => {
    try {
        await connectToDatabase();
        const branddeurInspectie = await BranddeurInspectie.findByIdAndDelete(req.params.id);
        if (!branddeurInspectie) return res.status(404).json({ message: 'Branddeur inspectie not found' });
        await syncMostRecentInspectionForBranddeur(branddeurInspectie.branddeurId);
        res.json({ message: 'Branddeur inspectie deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
