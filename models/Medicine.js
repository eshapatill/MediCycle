const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ""
    },

    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    city: {
      type: String,
      required: true,
      trim: true
    },

    medicineName: {
      type: String,
      required: true,
      trim: true
    },

    quantity: {
      type: String,
      required: true,
      trim: true
    },

    expiryDate: {
      type: Date,
      required: true
    },

    packagingCondition: {
      type: String,
      required: true,
      trim: true
    },

    collectionReason: {
      type: String,
      required: true,
      trim: true
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Completed"],
      default: "Pending"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Medicine", medicineSchema);