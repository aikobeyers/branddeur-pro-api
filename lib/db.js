// db.js
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

let isConnected = false; // Track connection state

const resolveCertificatePath = () => {
    const certificateFileName = process.env.MONGO_X509_CERT_FILE || 'X509-cert-6033945348190818801.pem';
    const candidates = [
        process.env.MONGO_X509_CERT_PATH,
        path.resolve(process.cwd(), 'certificate', certificateFileName),
        path.resolve(process.cwd(), '../../../certificate', certificateFileName),
        `/var/task/certificate/${certificateFileName}`,
    ].filter(Boolean);

    return candidates.find((candidate) => fs.existsSync(candidate));
};

const connectToDatabase = async () => {
    if (isConnected) {
        console.log('=> Using existing MongoDB connection');
        return;
    }

    console.log('=> Establishing new MongoDB connection');
    try {
        const certificatePath = resolveCertificatePath();
        if (!certificatePath) {
            throw new Error('Mongo x509 certificate file was not found. Set MONGO_X509_CERT_PATH or place the .pem file in /certificate.');
        }

        console.log(`=> Using certificate at: ${certificatePath}`);

        await mongoose.connect(process.env.MONGO_URI, {
            dbName: 'branddeur-pro',
            authMechanism: 'MONGODB-X509',
            authSource: '$external',
            tls: true,
            tlsCertificateKeyFile: certificatePath,
        });
        isConnected = true;
        console.log('=> MongoDB connected successfully');
    } catch (error) {
        console.error('=> MongoDB connection error:', error);
        throw new Error('Database connection failed');
    }
};

export default connectToDatabase;
