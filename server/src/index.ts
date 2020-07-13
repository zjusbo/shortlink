// import modules
import bodyparser from "body-parser";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import path from "path";
import { router } from "./routes/route";

let app = express();

const {
  MONGO_HOST: DB_HOST,
  MONGO_USERNAME: DB_USERNAME,
  MONGO_PASSWORD: DB_PASSWORD,
  MONGO_DB: DB_NAME,
} = process.env;

// connect to mongo db, using username and password. the default port is 27017
const mongoAddress = `mongodb://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:27017/${DB_NAME}`;
mongoose
  .connect(mongoAddress, { useNewUrlParser: true, useUnifiedTopology: true })
  .catch((error) => {
    console.error(`can not connect to the database: ${mongoAddress}`);
    console.error(error);
  });

// on connection
mongoose.connection.on("connected", () => {
  console.log(`Connected to database mongodb:${DB_NAME}`);
});

mongoose.connection.on("error", (err: any) => {
  if (err) {
    console.log("Error in database connection:" + err);
  }
});

// port number
const port = 3000;

// adding middleware
// these middlewares should be added before the router
app.use(cors());

// body-parser
app.use(bodyparser.json());

// static files
// all static files .html, .js, .css are being searched under the public folder.
// localhost:3000/about.html would be located from ./public/about.html
app.use(express.static(path.join(__dirname, "public")));

// use route to handle all requests under uri '/api'
app.use("/api", router);

// redirect all other paths to the homepage.
app.get(/.*/, function (req, res) {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log("Server started at port:" + port);
});
