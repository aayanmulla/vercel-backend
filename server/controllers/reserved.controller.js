const ReservedSlot = require('../models/ReservedSlot');
const SensorReading = require('../models/SensorReadings');

// Helper function to sync with sensor data
const syncWithSensorData = async () => {
    try {
        const latestReading = await SensorReading.findOne()
            .sort({ timestamp: -1 })
            .select("timestamp distances");

        if (!latestReading || !Array.isArray(latestReading.distances)) {
            console.log("No valid sensor data available");
            return;
        }

        const now = new Date();
        const sensorTimestamp = latestReading.timestamp;

        // Process each slot
        for (let i = 0; i < 8; i++) {
            const slotNumber = i + 1;
            let slot = await ReservedSlot.findOne({ slotNumber });

            // Create slot if doesn't exist
            if (!slot) {
                slot = new ReservedSlot({
                    slotNumber,
                    status: [7, 8].includes(slotNumber) ? 'under_construction' : 'available'
                });
            }

            // Handle under construction slots (7 & 8)
            if ([7, 8].includes(slotNumber)) {
                slot.status = 'under_construction';
                slot.isOccupied = null;
                slot.sensorAvailable = false;
                await slot.save();
                continue;
            }

            // Only process if sensor data is newer than last update
            if (!slot.lastSensorUpdate || sensorTimestamp > slot.lastSensorUpdate) {
                const distance = latestReading.distances[i] || 0;
                const sensorAvailable = distance > 5;

                // Update sensor data
                slot.sensorAvailable = sensorAvailable;
                slot.lastSensorUpdate = sensorTimestamp;

                // Check if slot should be auto-released
                const isExpired = slot.expiresAt && slot.expiresAt <= now;
                const shouldAutoRelease = !slot.paymentId || isExpired;

                if (shouldAutoRelease) {
                    slot.isOccupied = !sensorAvailable;
                    slot.status = sensorAvailable ? 'available' : 'occupied';

                    if (sensorAvailable) {
                        slot.paymentId = null;
                        slot.bookedAt = null;
                        slot.expiresAt = null;
                    }
                }

                await slot.save();
            }
        }
    } catch (error) {
        console.error("Sensor sync error:", error);
        throw error; // Rethrow to handle in calling functions
    }
};
// Get all parking slots (now synced with sensor data)
exports.getAllParkingSlots = async (req, res) => {
    try {
        // First sync with latest sensor data
        await syncWithSensorData();

        // Then return all slots
        const parkingSlots = await ReservedSlot.find().sort({ slotNumber: 1 });

        res.status(200).json({
            parkingSlots: parkingSlots.map(slot => ({
                id: slot.slotNumber,
                isOccupied: slot.isOccupied,
                status: slot.status
            }))
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching parking slots', error: error.message });
    }
};

// Book a parking slot (updated to check sensor data first)
exports.bookParkingSlot = async (req, res) => {
    const { slotId } = req.params;
    const { paymentId } = req.body;

    try {
        const slot = await ReservedSlot.findOne({ slotNumber: slotId });

        if (!slot) return res.status(404).json({ message: 'Slot not found' });
        if (slot.status === 'under_construction') {
            return res.status(400).json({ message: 'Slot under construction' });
        }
        if (slot.isOccupied && slot.expiresAt > new Date()) {
            return res.status(400).json({ message: 'Slot already occupied' });
        }

        // Proceed with booking
        slot.isOccupied = true;
        slot.paymentId = paymentId;
        slot.bookedAt = new Date();
        slot.expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
        slot.status = 'occupied';

        await slot.save();
        res.status(200).json({ message: 'Booking successful', slot });
    } catch (error) {
        res.status(500).json({ message: 'Booking failed', error: error.message });
    }
};

exports.getLatestBookedSlot = async (req, res) => {
    try {
        const latestBookedSlot = await ReservedSlot.findOne({
            isOccupied: true,
            status: 'occupied'
        }).sort({ bookedAt: -1 });

        if (!latestBookedSlot) {
            return res.status(200).json({ latestBookedSlotId: null });
        }

        res.status(200).json({
            latestBookedSlotId: latestBookedSlot.slotNumber
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching latest booked slot', error: error.message });
    }
};

// Optional: Add a method to release expired slots
exports.releaseExpiredSlots = async () => {
    try {
        await ReservedSlot.updateMany(
            {
                isOccupied: true,
                expiresAt: { $lt: new Date() }
            },
            {
                isOccupied: false,
                paymentId: null,
                bookedAt: null,
                expiresAt: null,
                status: 'available'
            }
        );
        console.log('Expired slots released');
    } catch (error) {
        console.error('Error releasing expired slots:', error);
    }
};

exports.updateParkingSlot = async (req, res) => {
    const { slotId } = req.params;
    const updates = req.body;

    try {
        // Convert slotId to number if needed
        const slotNumber = parseInt(slotId);
        if (isNaN(slotNumber)) {
            return res.status(400).json({ message: 'Invalid slot ID' });
        }

        // Find the slot by slotNumber (not ID)
        const slot = await ReservedSlot.findOne({ slotNumber });
        if (!slot) {
            return res.status(404).json({ message: 'Slot not found' });
        }

        // Debug log
        console.log('Current slot:', slot);
        console.log('Requested updates:', updates);

        // Validate updates
        const allowedUpdates = ['isOccupied', 'status', 'paymentId', 'expiresAt', 'bookedAt', 'timeSlot', 'occupiedBy'];
        const invalidUpdates = Object.keys(updates).filter(update => !allowedUpdates.includes(update));
        
        if (invalidUpdates.length > 0) {
            return res.status(400).json({ 
                message: `Invalid update fields: ${invalidUpdates.join(', ')}`,
                allowedFields: allowedUpdates
            });
        }

        // Special handling for booking
        if (updates.isOccupied === true) {
            if (!updates.paymentId) {
                return res.status(400).json({ message: 'Payment ID is required' });
            }
            if (!updates.timeSlot) {
                return res.status(400).json({ message: 'Time slot is required' });
            }
            
            updates.bookedAt = updates.bookedAt || new Date();
            updates.status = 'occupied';
        }

        // Apply updates
        Object.assign(slot, updates);

        // Handle status changes
        if (updates.status === 'available') {
            slot.isOccupied = false;
            slot.paymentId = null;
            slot.bookedAt = null;
            slot.expiresAt = null;
            slot.timeSlot = null;
            slot.occupiedBy = null;
        }

        // Save changes
        const updatedSlot = await slot.save();
        
        res.status(200).json({
            success: true,
            message: 'Slot updated successfully',
            slot: updatedSlot
        });

    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    }
};
    