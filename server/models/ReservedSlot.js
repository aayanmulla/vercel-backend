const mongoose = require('mongoose');

const ReservedSlotSchema = new mongoose.Schema({
    slotNumber: {
        type: Number,
        required: true,
        unique: true
    },
    isOccupied: {
        type: Boolean,
        default: false
    },
    occupiedBy: {
        type: String,
        default: null
    },
    paymentId: {
        type: String,
        default: null
    },
    bookedAt: {
        type: Date,
        default: null
    },
    expiresAt: {
        type: Date,
        default: null
    },
    timeSlot: {  // Add this new field
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['available', 'occupied', 'under_construction'],
        default: 'available'
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('ReservedSlot', ReservedSlotSchema);