const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the root .env file
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error('❌ MONGODB_URI is not defined in environment variables');
    process.exit(1);
}

const connectDB = async () => {
    try {
        // If already connected, return
        if (mongoose.connection.readyState === 1) {
            console.log('✅ Using existing MongoDB connection');
            return;
        }

        console.log('🔗 Connecting to MongoDB...');
        
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            retryWrites: true,
            w: 'majority'
        });
        
        console.log('✅ MongoDB connected successfully');
        return true;
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        throw err;
    }
};

// Event listeners
mongoose.connection.on('connected', () => {
    console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('📴 MongoDB connection closed');
    process.exit(0);
});

// Export the connectDB function directly
module.exports = connectDB;