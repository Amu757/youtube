import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../model/user.model.js";
import jwt from "jsonwebtoken";

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    //get token from req via cookie or header
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", ""); //replacing Beared keyword from header

    if (!token) throw new ApiError(401, "Unauthorized request");

    //verify and deconde token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    //
    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    //add user obj in req obj
    req.user = user;
    // console.log("user updated with blank token ");

    if (req.body.type === "getlogin") {
      res.status(200).json({
        data: { accessToken: token, user },
      });
    } else {
      next();
    }
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid Access Token");
  }
});

export { verifyJWT };
