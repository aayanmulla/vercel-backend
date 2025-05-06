const express = require("express");
const router = express.Router();
const SensorReading = require("../models/SensorReadings");

// API to get parking slots based on sensor data
router.get("/slots", async (req, res) => {
    try {
        // Fetch the latest sensor reading
        const latestReading = await SensorReading.findOne()
            .sort({ timestamp: -1 })
            .select("timestamp distances");

        if (!latestReading || !Array.isArray(latestReading.distances)) {
            return res.status(404).json({ message: "No valid sensor data available" });
        }

        // Process sensor data correctly
        const sensorData = latestReading.distances.map((distance, index) => ({
            sensor_id: index + 1, // Assign sensor ID sequentially
            distance: distance || 0 // Avoid undefined values
        }));

        // Define 8 parking slots
        let parkingSlots = Array.from({ length: 8 }, (_, index) => ({
            id: index + 1,
            isOccupied: true // Default all to occupied
        }));

        // Update occupancy based on sensor readings (for first 6 slots only)
        sensorData.forEach((sensor, index) => {
            if (index < 6) {
                const isAvailable = sensor.distance > 5; // Mark available if distance > 5
                parkingSlots[index].isOccupied = !isAvailable;
            }
        });

        // Ensure slot 7 & 8 are always "Under Construction"
        parkingSlots[6] = { id: 7, isOccupied: null };
        parkingSlots[7] = { id: 8, isOccupied: null };

        // Reorder slots (1-2-3-4 top, 8-7-6-5 bottom)
        const reorderedSlots = [
            parkingSlots[0], parkingSlots[1], parkingSlots[2], parkingSlots[3],
            parkingSlots[7], parkingSlots[6], parkingSlots[5], parkingSlots[4]
        ];

        // Cleanup mechanism: Delete the oldest 3 entries if there are 10 or more entries
        const totalEntries = await SensorReading.countDocuments();
        if (totalEntries >= 10) {
            const oldestEntries = await SensorReading.find()
                .sort({ timestamp: 1 }) // Sort by timestamp in ascending order (oldest first)
                .limit(3); // Limit to the oldest 3 entries

            // Delete the oldest 3 entries
            await SensorReading.deleteMany({
                _id: { $in: oldestEntries.map(entry => entry._id) }
            });

            console.log("🗑️ Deleted 3 oldest entries to maintain database size.");
        }

        res.json({ parkingSlots: reorderedSlots });
    } catch (error) {
        console.error("❌ Error fetching parking slots:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;