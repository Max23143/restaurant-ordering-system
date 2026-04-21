import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

const clientUrl = process.env.CLIENT_URL || "http://127.0.0.1:5500";

app.use(cors({
  origin: clientUrl,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Restaurant Ordering and Management API"
  });
});

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;