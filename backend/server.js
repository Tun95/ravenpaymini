import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";

import db from "./db/knex.js";

import userRouter from "./routes/userRoutes.js";
import accounterRouter from "./routes/accountRoutes.js";
import transactionRouter from "./routes/transactionRoutes.js";


dotenv.config();

const app = express();
app.use(express.json());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,OPTIONS,POST,PUT,PATCH,DELETE",
    credentials: true,
  })
);

// Routes
app.use("/api/users", userRouter);
app.use("/api/bank_accounts", accounterRouter);
app.use("/api/transactions", transactionRouter);

app.use((err, req, res, next) => {
  res.status(500).send({ message: err.message });
});

// Start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // To Ensure database is connected by testing the connection here
  db.raw("SELECT 1")
    .then(() => {
      console.log("connected to db successfully!");
    })
    .catch((err) => {
      console.error("Database connection failed:", err.message);
    });
});
