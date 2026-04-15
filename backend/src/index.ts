import dotenv from "dotenv";

import { app } from "./app.js";
dotenv.config({
  path: "./.env",
});
import connectDB from "./db/index.js";
connectDB()
  .then(() => {
    app.get("/", (req, res) => {
      res.send("Hello World");
    });

    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO DB connection failed! ", err);
  });

export default app;
