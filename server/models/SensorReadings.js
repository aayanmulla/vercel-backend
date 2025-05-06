const mongoose = require("mongoose");

// Define connection for sensor_database
const sensorDB = mongoose.connection.useDb("sensor_database");

const sensorReadingSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  distances: [
    {
      type: Number,  // Change this from an object to a direct number
      min: 0,
      max: 400
    }
  ]
});

// Index for faster queries
sensorReadingSchema.index({ timestamp: 1 });

// Create model using sensor_database
const SensorReading = sensorDB.model("sensor_reading", sensorReadingSchema);
module.exports = SensorReading;
