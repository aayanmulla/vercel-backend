const express = require("express");
const router = express.Router();
const sensorController = require("../controllers/sensor.controller");

// Route to save sensor data
router.post("/save", sensorController.saveSensorData);

// Route to get the latest sensor data
router.get("/latest", sensorController.getLatestData);

// Route to get all sensor data (paginated)
router.get("/all", sensorController.getAllData);

module.exports = router;
