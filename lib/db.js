// db.js
import mongoose from 'mongoose';

let isConnected = false; // Track connection state

const connectToDatabase = async () => {
    if (isConnected) {
        console.log('=> Using existing MongoDB connection');
        return;
    }

    console.log('=> Establishing new MongoDB connection');
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: 'branddeur-pro'
        });
        isConnected = true;
        console.log('=> MongoDB connected successfully');
    } catch (error) {
        console.error('=> MongoDB connection error:', error);
        throw new Error('Database connection failed');
    }
};

export default connectToDatabase;
