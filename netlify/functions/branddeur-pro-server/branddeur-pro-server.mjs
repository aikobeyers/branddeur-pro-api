import dotenv from 'dotenv';

import express, { Router, json } from 'express';
import serverless from 'serverless-http';
import cors from 'cors';

// Load environment variables from .env file (works in local dev, ignored in production)
dotenv.config();

import connectToDatabase from '../../../lib/db.js';
import Branddeur from '../../../models/branddeur.js';
import InspectieChecklistItem from '../../../models/inspectieChecklistItem.js';
import BranddeurInspectie, { STATUS_OPTIONS } from '../../../models/branddeurInspectie.js';
import verifyToken from '../../../middleware/authMiddleware.js';

const app = express();
const router = Router();

const normalizeCheckListItems = (checkListItems) => {
    if (!checkListItems) {
        return [];
    }

    if (Array.isArray(checkListItems)) {
        return checkListItems;
    }

    return Object.entries(checkListItems).map(([itemId, value]) => ({
        itemId,
        value: typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value),
    }));
};

const getNormalizedCheckListItemsFromBody = (body) => {
    const rawCheckListItems = body.checkListItems ?? body.checklistItems;

    if (rawCheckListItems === undefined) {
        return undefined;
    }

    return normalizeCheckListItems(rawCheckListItems);
};

const normalizeInspectionResult = (inspectionResult) => {
    if (inspectionResult === undefined) {
        return undefined;
    }

    if (inspectionResult === null) {
        return null;
    }

    if (typeof inspectionResult === 'object' && inspectionResult.statusCode && inspectionResult.statusValue) {
        return inspectionResult;
    }

    if (typeof inspectionResult === 'string') {
        // Check if it's a status code (A, B, C)
        if (STATUS_OPTIONS[inspectionResult]) {
            return {
                statusCode: inspectionResult,
                statusValue: STATUS_OPTIONS[inspectionResult],
            };
        }

        // Check if it's a status value (Goedgekeurd, Herstel nodig, Afgekeurd)
        const statusCode = Object.entries(STATUS_OPTIONS)
            .find(([, statusValue]) => statusValue === inspectionResult)?.[0];

        if (statusCode) {
            return {
                statusCode,
                statusValue: inspectionResult,
            };
        }
    }

    return inspectionResult;
};

const syncMostRecentInspectionForBranddeur = async (branddeurId) => {
    if (!branddeurId) {
        return;
    }

    const latestInspection = await BranddeurInspectie.findOne({ branddeurId })
        .sort({ inspectionDate: -1, createdAt: -1 });

    await Branddeur.findByIdAndUpdate(branddeurId, {
        mostRecentInspection: latestInspection?._id ?? null,
    });
};

// Middleware
app.use(json());
app.use(cors({
    origin: '*',
    allowedHeaders: '*',
    allowCredentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.options('*', cors()); // Handle preflight requests

// Routes

// Get all branddeurs
router.get('/branddeuren', async (req, res) => {
    try {
        await connectToDatabase();
        console.log('Getting all branddeurs');
        const branddeurs = await Branddeur.find().populate('mostRecentInspection');
        res.json(branddeurs);
    } catch (err) {
        console.error('Error fetching brands:', err);
        res.status(500).json({message: 'Internal Server Error'});
    }
});

// Get all inspectie checklist items
router.get('/inspectie-checklist-items', async (req, res) => {
    try {
        await connectToDatabase();
        const inspectieChecklistItems = await InspectieChecklistItem.find();
        res.json(inspectieChecklistItems);
    } catch (err) {
        console.error('Error fetching inspectie checklist items:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get all branddeur inspecties
router.get('/branddeur-inspecties', async (req, res) => {
    try {
        await connectToDatabase();
        const branddeurInspecties = await BranddeurInspectie.find()
            .populate('branddeurId')
            .populate('checkListItems.itemId');
        res.json(branddeurInspecties);
    } catch (err) {
        console.error('Error fetching branddeur inspecties:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get a single branddeur inspectie by ID
router.get('/branddeur-inspecties/:id', async (req, res) => {
    try {
        await connectToDatabase();
        const branddeurInspectie = await BranddeurInspectie.findById(req.params.id)
            .populate('branddeurId')
            .populate('checkListItems.itemId');
        if (!branddeurInspectie) return res.status(404).json({ message: 'Branddeur inspectie not found' });
        res.json(branddeurInspectie);
    } catch (err) {
        console.error('Error fetching branddeur inspectie by ID:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Create a new branddeur inspectie
router.post('/branddeur-inspecties', async (req, res) => {
    try {
        await connectToDatabase();

        const {
            branddeurId,
            foundProblems,
            generalCondition,
            inspectionDate,
            inspectionResult,
            inspectionType,
            inspectorName,
            nextInspection,
        } = req.body;
        const normalizedCheckListItems = getNormalizedCheckListItemsFromBody(req.body);
        if (!branddeurId) {
            return res.status(400).json({ message: 'branddeurId is required' });
        }

        const branddeurInspectie = new BranddeurInspectie({
            branddeurId,
            checkListItems: normalizedCheckListItems ?? [],
            foundProblems,
            generalCondition,
            inspectionDate,
            inspectionResult: normalizeInspectionResult(inspectionResult),
            inspectionType,
            inspectorName,
            nextInspection,
        });
        const newBranddeurInspectie = await branddeurInspectie.save();
        await syncMostRecentInspectionForBranddeur(branddeurId);
        res.status(201).json(newBranddeurInspectie);
    } catch (err) {
        console.error('Error creating branddeur inspectie:', err);
        res.status(400).json({ message: 'Bad Request. ' + err.message });
    }
});

// Update a branddeur inspectie
router.put('/branddeur-inspecties/:id', async (req, res) => {
    try {
        await connectToDatabase();
        if (!req.params.id) {
            return res.status(400).json({ message: 'Branddeur inspectie ID is required' });
        }

        const existingBranddeurInspectie = await BranddeurInspectie.findById(req.params.id);
        if (!existingBranddeurInspectie) {
            return res.status(404).json({ message: 'Branddeur inspectie not found' });
        }

        const updatePayload = {
            ...req.body,
        };

        const normalizedCheckListItems = getNormalizedCheckListItemsFromBody(req.body);
        if (normalizedCheckListItems !== undefined) {
            updatePayload.checkListItems = normalizedCheckListItems;
        }

        if (req.body.inspectionResult !== undefined) {
            updatePayload.inspectionResult = normalizeInspectionResult(req.body.inspectionResult);
        }

        delete updatePayload.checklistItems;

        const branddeurInspectie = await BranddeurInspectie.findByIdAndUpdate(req.params.id, updatePayload, {
            new: true,
            runValidators: true,
        });

        await syncMostRecentInspectionForBranddeur(existingBranddeurInspectie.branddeurId);
        if (String(existingBranddeurInspectie.branddeurId) !== String(branddeurInspectie.branddeurId)) {
            await syncMostRecentInspectionForBranddeur(branddeurInspectie.branddeurId);
        }

        res.json(branddeurInspectie);
    } catch (err) {
        console.error('Error updating branddeur inspectie:', err);
        res.status(400).json({ message: 'Bad Request. ' + err.message });
    }
});

// Delete a branddeur inspectie
router.delete('/branddeur-inspecties/:id', async (req, res) => {
    try {
        await connectToDatabase();
        const branddeurInspectie = await BranddeurInspectie.findByIdAndDelete(req.params.id);
        if (!branddeurInspectie) return res.status(404).json({ message: 'Branddeur inspectie not found' });

        await syncMostRecentInspectionForBranddeur(branddeurInspectie.branddeurId);
        res.json({ message: 'Branddeur inspectie deleted' });
    } catch (err) {
        console.error('Error deleting branddeur inspectie:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get a single branddeur by ID
router.get('/branddeuren/:id', async (req, res) => {
    try {
        await connectToDatabase();
        const branddeur = await Branddeur.findById(req.params.id).populate('mostRecentInspection');
        if (!branddeur) return res.status(404).json({message: 'Branddeur not found'});
        res.json(branddeur);
    } catch (err) {
        console.error('Error fetching brand by ID:', err);
        res.status(500).json({message: 'Internal Server Error'});
    }
});

// Create a new branddeur
router.post('/branddeuren', /*verifyToken,*/ async (req, res) => {
    try {
        await connectToDatabase();

        const {
            name,
            doorType,
            resistanceMinutes,
            building,
            floor,
            location,
            initialInspectionDate,
            manufacturer,
        } = req.body;

        if (!name) {
            return res.status(400).json({message: 'Branddeur name is required'});
        }

        const branddeur = new Branddeur({
            name,
            doorType,
            resistanceMinutes,
            building,
            floor,
            location,
            initialInspectionDate,
            manufacturer,
        });
        const newBranddeur = await branddeur.save();
        res.status(201).json(newBranddeur);

    } catch (err) {
        console.error('Error creating brand:', err);
        res.status(400).json({message: 'Bad Request. ' + err.message});
    }
});

// Update a branddeur
router.put('/branddeuren/:id', /*verifyToken,*/ async (req, res) => {
    try {
        await connectToDatabase();
        if (!req.params.id) {
            return res.status(400).json({message: 'Branddeur ID is required'});
        }

        const existingBranddeur = await Branddeur.findById(req.params.id);
        if (!existingBranddeur) {
            return res.status(404).json({message: 'Branddeur not found'});
        }

        const updatePayload = {
            ...req.body,
        };

        // Only allow editing initialInspectionDate when no inspection has been linked yet.
        if (existingBranddeur.mostRecentInspection) {
            delete updatePayload.initialInspectionDate;
        }

        const branddeur = await Branddeur.findByIdAndUpdate(req.params.id, updatePayload, {
            new: true,
            runValidators: true,
        });

        res.json(branddeur);
    } catch (err) {
        console.error('Error updating brand:', err);
        res.status(400).json({message: 'Bad Request. ' + err.message});
    }
});

// Delete a branddeur
router.delete('/branddeuren/:id', verifyToken, async (req, res) => {
    try {
        await connectToDatabase();
        const branddeur = await Branddeur.findByIdAndDelete(req.params.id);
        if (!branddeur) return res.status(404).json({message: 'Branddeur not found'});
        res.json({message: 'Branddeur deleted'});
    } catch (err) {
        console.error('Error deleting brand:', err);
        res.status(500).json({message: 'Internal Server Error'});
    }
});

app.use('/.netlify/functions/branddeur-pro-server', router);

export const handler = serverless(app);
