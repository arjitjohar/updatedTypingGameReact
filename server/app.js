const express = require("express");
const axios = require("axios");
const cors = require("cors")
require("dotenv").config();

const app = express();
const port = 3000;

// Route to generate random AI paragraph
app.get("/generate", cors(), async (req, res) => {
  try {
    const response = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model: "sonar", // You can choose other models like "sonar-pro".
        messages: [
          { role: "system", content: "Generate a random paragraph of about 100 words." },
          { role: "user", content: "Write a random paragraph about any topic in 100 words." },
        ],
        max_tokens: 150,
        temperature: 0.7, // Adjust for creativity (higher = more creative).
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`, // Use your API key from .env.
        },
      }
    );

    const paragraph = response.data.choices[0].message.content.trim();
    res.send({ paragraph });
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    res.status(500).send("Error generating paragraph.");
  }
});

// Route to generate a list of random words that the user can type from. 
app.get("/generate mistakes", cors(), async (req, res) => {
  try {
    const response = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model: "sonar", // You can choose other models like "sonar-pro".
        messages: [
          { role: "system", content: "Generate a list of the top 100 most commonly words that the user" },
          { role: "user", content: "Write a random paragraph about any topic in 100 words." },
        ],
        max_tokens: 150,
        temperature: 0.7, // Adjust for creativity (higher = more creative).
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`, // Use your API key from .env.
        },
      }
    );

    const paragraph = response.data.choices[0].message.content.trim();
    res.send({ paragraph });
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    res.status(500).send("Error generating paragraph.");
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
