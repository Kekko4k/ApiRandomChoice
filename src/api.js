const express = require("express");
const serverless = require("serverless-http");

// Create an instance of the Express app
const app = express();
const path = require('path'); 
// Create a router to handle routes
const router = express.Router();

// Define a route that responds with a JSON object when a GET request is made to the root path
router.get("/", (req, res) => {
  res.json({
    ciao: "hi!"
  });
});

router.get("/prova", (req, res) => {
  res.json({
    prova: "prova!"
  });
});


// Use the router to handle requests to the `/.netlify/functions/api` path
//app.use(`/.netlify/functions/api`, router);
app.use('/', router); 
app.listen(process.env.port || 5000); 
// Export the app and the serverless function
module.exports = app;
module.exports.handler = serverless(app);