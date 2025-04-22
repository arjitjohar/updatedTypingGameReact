// Import necessary AWS SDK v3 clients and commands
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
// If not using ES modules (import), use require:
// const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
// const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

// --- Configuration ---
const REGION = "us-east-1"; // Replace with your AWS region if different
const TABLE_NAME = "TypingTexts"; // The name of your DynamoDB table

// --- Data to Insert ---
// Using the sample data provided. For 100+ paragraphs, load from a JSON file.
const paragraphsToInsert = [
  {
    Theme: "formal",
    TextID: "formal-memo-001",
    ParagraphText: "Please be advised that the quarterly budget review meeting has been rescheduled. The meeting will now take place on Friday, October 27th, at 10:00 AM in Conference Room B. Your attendance is required. Kindly update your calendars accordingly and come prepared to discuss departmental expenditures and projections for the upcoming fiscal period.",
    Difficulty: "medium",
    Source: "Internal Memo",
    Length: 378
  },
  {
    Theme: "informal",
    TextID: "informal-chat-001",
    ParagraphText: "Hey! Just wanted to see if you're free later? Thinking of grabbing some pizza around 7ish. Let me know if that works for you. No worries if not, maybe another time! Hope you're having a good day!",
    Difficulty: "easy",
    Source: "Casual Message",
    Length: 235
  },
  {
    Theme: "novel",
    TextID: "novel-austen-001",
    ParagraphText: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.",
    Difficulty: "medium",
    Source: "Pride and Prejudice",
    Length: 440
  },
  {
    Theme: "essay",
    TextID: "essay-climate-001",
    ParagraphText: "The evidence for anthropogenic climate change is unequivocal, supported by decades of research across multiple scientific disciplines. Rising global temperatures, increasingly frequent extreme weather events, and melting polar ice caps are observable consequences demanding immediate and concerted action. Mitigation strategies must focus on reducing greenhouse gas emissions through transitions to renewable energy sources and enhanced energy efficiency.",
    Difficulty: "hard",
    Source: "Climate Change Essay Snippet",
    Length: 532
  },
  {
    Theme: "scientific",
    TextID: "scientific-neuro-001",
    ParagraphText: "Synaptic plasticity, the ability of synapses to strengthen or weaken over time in response to increases or decreases in their activity, is a fundamental property of the nervous system. Long-term potentiation (LTP) and long-term depression (LTD) are widely studied forms of synaptic plasticity thought to underlie learning and memory formation. Molecular mechanisms involving NMDA receptor activation and calcium influx are critical for inducing these changes.",
    Difficulty: "hard",
    Source: "Neuroscience Abstract",
    Length:577
  },
  {
    Theme: "technical",
    TextID: "tech-react-hooks-001",
    ParagraphText: "Hooks are functions that let you “hook into” React state and lifecycle features from function components. Hooks don’t work inside classes — they let you use React without classes. The `useState` Hook allows you to add React state to function components. We call it inside a function component to add some local state to it. React will preserve this state between re-renders.",
    Difficulty: "medium",
    Source: "React Documentation",
    Length:416
  }
  // --- Add your other 94+ paragraph objects here ---
];

// --- Initialize DynamoDB Clients ---
// Create an AWS DynamoDB client service object
const dbClient = new DynamoDBClient({ region: REGION });
// Create the DynamoDB Document Client interface for easier data handling
const docClient = DynamoDBDocumentClient.from(dbClient);

// --- Main Function to Insert Data ---
const populateTable = async () => {
  console.log(`Starting population of ${TABLE_NAME}...`);
  let successCount = 0;
  let errorCount = 0;

  // Loop through each paragraph object
  for (const paragraph of paragraphsToInsert) {
    // Define the parameters for the PutCommand
    const params = {
      TableName: TABLE_NAME,
      Item: paragraph, // The entire paragraph object is the item
      // ConditionExpression: 'attribute_not_exists(TextID)' // Optional: Prevent overwriting existing items
    };

    try {
      // Create and send the PutCommand
      const command = new PutCommand(params);
      await docClient.send(command);
      console.log(`Successfully inserted TextID: ${paragraph.TextID} (Theme: ${paragraph.Theme})`);
      successCount++;
    } catch (error) {
      console.error(`Error inserting TextID: ${paragraph.TextID} (Theme: ${paragraph.Theme}):`, error);
      errorCount++;
      // Decide if you want to stop on error or continue
      // break; // Uncomment to stop on the first error
    }
  }

  console.log("----------------------------------------");
  console.log(`Population finished.`);
  console.log(`Successfully inserted: ${successCount} items.`);
  console.log(`Failed to insert: ${errorCount} items.`);
  console.log("----------------------------------------");
};

// --- Execute the Main Function ---
populateTable().catch((error) => {
  console.error("An unexpected error occurred during table population:", error);
  process.exit(1); // Exit with error code
});
