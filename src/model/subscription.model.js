import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema({
 Subscriber:{
 type: Schema.types.ObjectId, //one who is subscribing to my channel
 ref:"User"
},
channel:{
     type: Schema.types.ObjectId, //one who is subscribing to my channel
     ref:"User"
 }

})

export const Subscription = mongoose.model("Subscription",subscriptionSchema)