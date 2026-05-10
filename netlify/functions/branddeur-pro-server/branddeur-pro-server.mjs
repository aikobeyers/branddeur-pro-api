require('dotenv').config({path: '../.env'});

const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const mongoose = require('mongoose');

const connectToDatabase = require('../lib/db');
const Branddeur = require('../models/branddeur');
const verifyToken = require('../middleware/authMiddleware');

const app = express();
const router = express.Router();

// Middleware
app.use(express.json());
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
        const branddeurs = await Branddeur.find();
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
        const branddeur = await Branddeur.findById(req.params.id);
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

        const branddeur = await Branddeur.findByIdAndUpdate(req.params.id, req.body, {new: true});
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
        const branddeur = await Branddeur.findByIdAndDelete(req.params.id);
        if (!branddeur) return res.status(404).json({message: 'Branddeur not found'});
        res.json({message: 'Branddeur deleted'});
    } catch (err) {
        console.error('Error deleting brand:', err);
        res.status(500).json({message: 'Internal Server Error'});
    }
});

app.use('/.netlify/functions/server', router);

module.exports.handler = serverless(app);
