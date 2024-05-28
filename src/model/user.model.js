import mongoose, { Schema } from "mongoose"; //no need to mention mongoose.schema
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, //make easy to search in database
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, //url from cloudnary
      required: true,
    },
    coverImage: {
      type: String, //url from cloudnary
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"], // custom error message
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  //mongoose hooks to do something before saving data into DB on save event
  if (this.isModified("password")) return next(); //if passward is not modified then return

  this.password = bcrypt.hash(this.password, 10); //10 is a hash round number
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  //mongoose userdefined methods
  await bcrypt.compare(password, this.password); //methods also has access to database objects
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  ); //generates token
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPITY,
    }
  ); //generates token
};

export const User = mongoose.model("User", userSchema);
