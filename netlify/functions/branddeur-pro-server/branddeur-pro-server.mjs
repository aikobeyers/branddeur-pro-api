require('dotenv').config({path: '../.env'});

import express, { Router, json } from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import mongoose from 'mongoose';

import connectToDatabase from '../lib/db';
import Branddeur, { find, findById, findByIdAndUpdate, findByIdAndDelete } from '../models/branddeur';
import verifyToken from '../middleware/authMiddleware';

const app = express();
const router = Router();

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
router.get('/', async (req, res) => {
    try {
        await connectToDatabase();
        console.log('Getting all branddeurs');
        const branddeurs = await find();
        res.json(branddeurs);
    } catch (err) {
        console.error('Error fetching brands:', err);
        res.status(500).json({message: 'Internal Server Error'});
    }
});

// Get a single branddeur by ID
router.get('/:id', async (req, res) => {
    try {
        await connectToDatabase();
        const branddeur = await findById(req.params.id);
        if (!branddeur) return res.status(404).json({message: 'Branddeur not found'});
        res.json(branddeur);
    } catch (err) {
        console.error('Error fetching brand by ID:', err);
        res.status(500).json({message: 'Internal Server Error'});
    }
});

// Create a new branddeur
router.post('/', verifyToken, async (req, res) => {
    try {
        await connectToDatabase();

        if (!req.body.name) {
            return res.status(400).json({message: 'Branddeur name is required'});
        }

        const branddeur = new Branddeur({name: req.body.name});
        const newBranddeur = await branddeur.save();
        res.status(201).json(newBranddeur);

    } catch (err) {
        console.error('Error creating brand:', err);
        res.status(400).json({message: 'Bad Request. ' + err.message});
    }
});

// Update a branddeur
router.put('/:id', verifyToken, async (req, res) => {
    try {
        await connectToDatabase();
        if (!req.params.id) {
            return res.status(400).json({message: 'Branddeur ID is required'});
        }

        const branddeur = await findByIdAndUpdate(req.params.id, req.body, {new: true});
        if (!branddeur) return res.status(404).json({message: 'Branddeur not found'});
        res.json(branddeur);
    } catch (err) {
        console.error('Error updating brand:', err);
        res.status(400).json({message: 'Bad Request. ' + err.message});
    }
});

// Delete a branddeur
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await connectToDatabase();
        const branddeur = await findByIdAndDelete(req.params.id);
        if (!branddeur) return res.status(404).json({message: 'Branddeur not found'});
        res.json({message: 'Branddeur deleted'});
    } catch (err) {
        console.error('Error deleting brand:', err);
        res.status(500).json({message: 'Internal Server Error'});
    }
});

app.use('/.netlify/functions/server', router);

export const handler = serverless(app);
