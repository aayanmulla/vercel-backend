const express = require('express');
const router = express.Router();
const reservedController = require('../controllers/reserved.controller'); // Note: You had reserved.controller, ensure the filename matches
const ReservedSlot = require('../models/ReservedSlot'); // Add this line to import the model

// Get all parking slots
router.get('/slots', reservedController.getAllParkingSlots);

// Book a specific parking slot
router.post('/book/:slotId', reservedController.bookParkingSlot);

// Get the latest booked slot
router.get('/latest-booked-slot', reservedController.getLatestBookedSlot);

// Update a parking slot status
router.patch('/:slotId', async (req, res) => {
    try {
        const { isOccupied, paymentId, timeSlot, bookingDate } = req.body;
        
        // Find the slot by ID (assuming MongoDB/Mongoose)
        const slot = await ReservedSlot.findById(req.params.slotId);
        if (!slot) {
            return res.status(404).json({ message: 'Slot not found' });
        }

        // Update the fields
        slot.isOccupied = isOccupied;
        slot.paymentId = paymentId;
        slot.timeSlot = timeSlot;
        slot.bookingDate = bookingDate;

        const updatedSlot = await slot.save();
        res.json(updatedSlot);
    } catch (error) {
        console.error('Error updating slot:', error);
        res.status(500).json({ 
            message: 'Error updating slot',
            error: error.message 
        });
    }
});

router.get('/slotNumber/:slotId', async (req, res) => {
    const { slotId } = req.params;

    try {
        const slotNumber = parseInt(slotId);
        if (isNaN(slotNumber)) {
            return res.status(400).json({ message: 'Invalid slot ID' });
        }

        const slot = await ReservedSlot.findOne({ slotNumber });
        if (!slot) {
            return res.status(404).json({ message: 'Slot not found' });
        }

        res.status(200).json(slot);
    } catch (error) {
        console.error('Error fetching slot:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
});

module.exports = router;