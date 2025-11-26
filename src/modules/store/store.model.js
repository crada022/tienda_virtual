import mongoose from "mongoose";

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: false,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      required: false,
    },
    active: {
      type: Boolean,
      default: true, // Soft delete
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Store", storeSchema);
