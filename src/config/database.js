const mongoose = require("mongoose");

// Connect the application to MongoDB using the URI from environment variables.
const connectDatabase = async () => {
    const mongoUri =
        process.env.MONGODB_URI ||
        "mongodb://127.0.0.1:27017/database_engineering_api";

    await mongoose.connect(mongoUri);

    console.log("MongoDB connected successfully.");
};

// Close the active MongoDB connection during graceful shutdown.
const disconnectDatabase = async () => {
    await mongoose.connection.close();

    console.log("MongoDB connection closed.");
};

module.exports = {
    connectDatabase,
    disconnectDatabase,
};
