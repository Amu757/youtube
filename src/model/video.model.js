import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";  //aggregation pipeline used for complex queries 

const videoSchema = new Schema({
videoFile:{
    type:String, //coudnary url
    required:true
},thumbnail:{
    type:String, //coudnary url
    required:true
},title:{
    type:String, 
    required:true
},description:{
    type:String, 
    required:true
},duration:{
    type:Number,  //can get from cloudnary 
    required:true
},view:{
    type:Number,  //can get from cloudnary 
    default:0
},isPublished:{
    type:Boolean,  //can get from cloudnary 
    default:true
},owner:{
    type:Schema.Types.ObjectId,
    ref:"User"
}

},{timestamps:true})


videoSchema.plugin(mongooseAggregatePaginate)  // works as plugin or extrafuncnality 

export const Video = mongoose.model("Video",videoSchema)