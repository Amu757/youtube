import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema({
  subscriber: {
    type: Schema.Types.ObjectId, //one who is subscribing to my channel
    ref: "User",
  },
  channel: {
    type: Schema.Types.ObjectId, //one who is subscribing to my channel
    ref: "User",
  },
});

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
