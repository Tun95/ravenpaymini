import express from "express";
import bcrypt from "bcryptjs";
import { generateToken, isAdmin, isAuth } from "../utils.js";
import expressAsyncHandler from "express-async-handler";
import UserModel from "../models/userModel.js";

const userRouter = express.Router();

// Signup route
userRouter.post(
  "/signup",
  expressAsyncHandler(async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    try {
      // Check if the user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Check if this is the first user signing up
      const users = await UserModel.findAll();
      const isAdmin = users.length === 0; // The first user is admin

      // Create a new user
      const user = await UserModel.create({
        first_name: firstName,
        last_name: lastName,
        email,
        password: hashedPassword,
        is_admin: isAdmin, // This will be true or false
      });

      // Generate a token and return user data
      res.status(201).json({
        message: "User created successfully",
        user: {
          id: user.id, // Consistent with your database field name
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          isAdmin: user.is_admin,
        },
        token: generateToken(user),
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  })
);

// Login route
userRouter.post(
  "/login",
  expressAsyncHandler(async (req, res) => {
    const { email, password } = req.body;

    try {
      // Find the user by email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (user.is_blocked) {
        return res.status(403).json({ message: "Your account is blocked" });
      }

      // Check if the password is correct
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate a token and return user data
      res.json({
        message: "Login successful",
        user: {
          id: user.id, // Consistent with your database field name
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          isAdmin: user.is_admin,
        },
        token: generateToken(user),
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  })
);

// Fetch all users
userRouter.get(
  "/",
  expressAsyncHandler(async (req, res) => {
    try {
      const users = await UserModel.findAll();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  })
);

// Get user profile details
userRouter.get(
  "/profile",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    try {
      const user = await UserModel.findById(req.user.id); // Use `req.user.id` instead of `req.user._id`
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  })
);

// Admin-only route: Get all users
userRouter.get(
  "/users",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    try {
      const users = await UserModel.findAll({});
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  })
);

// Admin-only route: Delete user by ID
userRouter.delete(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      // Check if the user exists
      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Delete the user
      await UserModel.deleteUser(id);

      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  })
);

export default userRouter;
