const mongoose = require("mongoose");

const dbConnecting = () =>
  mongoose
    .connect(process.env.DB_URL)
    .then(() => {
      console.log("db connected Successfully✅");
    })
    .catch((err) => {
      console.error(`error on connection with db💥: ${err}`);
      process.exit(1); // close server
    });

module.exports = dbConnecting;
