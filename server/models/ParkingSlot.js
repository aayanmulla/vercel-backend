const mongoose = require("mongoose");

const ParkingSlotSchema = new mongoose.Schema({
    slotNumber: { type: Number, required: true, unique: true },
    isOccupied: { type: Boolean, required: true }
});

module.exports = mongoose.model("ParkingSlot", ParkingSlotSchema);
