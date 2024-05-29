import { Router, Router } from "express";
import { registerUser } from "../controlers/user.controler";
const router = Router()

router.route("/register").post(registerUser)    //endpoint is handlled by registerUser controller

export default router;
