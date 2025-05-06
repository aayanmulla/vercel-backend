const SensorReading = require("../models/SensorReadings");

// Save sensor data
exports.saveSensorData = async (req, res) => {
  try {
    const { distances } = req.body;

    // Ensure distances contain valid values
    if (!distances || !Array.isArray(distances) || distances.length !== 6) {
      return res.status(400).json({ error: "Invalid sensor data format" });
    }

    const newReading = new SensorReading({
      distances
    });

    await newReading.save();
    res.status(201).json({ message: "Sensor data saved", data: newReading });
  } catch (error) {
    res.status(500).json({ error: "Error saving sensor data", details: error });
  }
};

// Get latest sensor data
exports.getLatestData = async (req, res) => {
  try {
    const latestReading = await SensorReading.findOne().sort({ timestamp: -1 });
    if (!latestReading) {
      return res.status(404).json({ message: "No sensor data found" });
    }
    res.status(200).json(latestReading);
  } catch (error) {
    res.status(500).json({ error: "Error fetching data", details: error });
  }
};

// Get all sensor data (with pagination)
exports.getAllData = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const readings = await SensorReading.find()
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.status(200).json(readings);
  } catch (error) {
    res.status(500).json({ error: "Error fetching data", details: error });
  }
};
