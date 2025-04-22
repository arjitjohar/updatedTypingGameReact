require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cors = require('cors');
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand, BatchGetItemCommand } = require("@aws-sdk/lib-dynamodb"); // Added QueryCommand, GetCommand, BatchGetItemCommand

const app = express();
const PORT = process.env.PORT || 3000; // Backend port


// In backend server.js
const session = require('express-session');
const DynamoDBStore = require('connect-dynamodb')(session);

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { /* ... secure options ... */ },
    store: new DynamoDBStore({
        table: 'TypingGameSessions', // Choose a name, e.g., 'TypingGameSessions'
        client: dynamoClient, // Pass your initialized DynamoDB client
        // Optional: adjust read/write capacity if not using on-demand for session table
    })
}));



// --- AWS SDK DynamoDB Setup ---
// TODO: Configure AWS region and credentials appropriately
// (e.g., via environment variables, IAM role)
const awsRegion = process.env.AWS_REGION || "us-east-1";
const dynamoClient = new DynamoDBClient({ region: awsRegion });
const docClient = DynamoDBDocumentClient.from(dynamoClient);


const tableName = process.env.DYNAMODB_TABLE_USERS; // for the users
const textsTableName = process.env.DYNAMODB_TABLE_TEXTS;
const gsiName = process.env.DYNAMODB_GSI_WPM;
const sessionsTableName = process.env.DYNAMODB_TABLE_SESSIONS; // session table for connect dynamodb


// --- Middleware ---

// Body Parser for JSON requests
app.use(express.json());
// In server.js

// Read the frontend URL from the environment variable set by Beanstalk/Terraform
const allowedOrigin = process.env.FRONTEND_URL; // e.g., "https://arjitjohar.com"

// CORS Configuration for Production
app.use(cors({
    origin: allowedOrigin, // Use the environment variable
    credentials: true      // Allow cookies to be sent from the allowed origin
}));

// Add a check to ensure the variable is set in production
if (process.env.NODE_ENV === 'production' && !allowedOrigin) {
    console.error("FATAL ERROR: FRONTEND_URL environment variable is not set.");
    // Optionally exit the process if the frontend URL is critical
    // process.exit(1);
}

// Fallback for local development (if needed, outside of production check)
// if (process.env.NODE_ENV !== 'production') {
//     app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
// }

// Session Management
// TODO: Use a proper session store for production (e.g., connect-mongo, connect-redis)
app.use(session({
    secret: 'session_secret' || 'your_very_secret_key', // Replace with a strong secret in .env
    resave: false,
    saveUninitialized: false, // Set to true if you want sessions for non-logged-in users
    cookie: {
        // secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
        // httpOnly: true, // Helps prevent XSS attacks
        // maxAge: 24 * 60 * 60 * 1000 // Example: 1 day
    }
}));

// Passport Initialization
app.use(passport.initialize());
app.use(passport.session());

// --- Passport Configuration ---

// TODO: Replace placeholders with your actual Google Client ID and Secret in .env
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET';
// TODO: Ensure this callback URL matches Google Cloud Console AND the route below
const CALLBACK_URL = 'http://localhost:3000/auth/google/callback' || `http://localhost:${PORT}/auth/google/callback`;

if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID' || GOOGLE_CLIENT_SECRET === 'YOUR_GOOGLE_CLIENT_SECRET') {
    console.warn("!!! WARNING: Using placeholder Google credentials. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables. !!!");
}

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: CALLBACK_URL,
    scope: ['profile', 'email'] // Request user's profile and email
},
    (accessToken, refreshToken, profile, done) => {
        // This function is called after successful authentication by Google.
        // 'profile' contains the user's Google profile information.
        // Here, you would typically find or create a user in your database.
        console.log('Google Profile:', profile);

        // For now, just pass the profile information along.
        // In a real app, you'd associate this profile with your app's user model.
        // Example: findOrCreateUser({ googleId: profile.id, email: profile.emails[0].value, name: profile.displayName })
        //   .then(user => done(null, user))
        //   .catch(err => done(err));

        return done(null, profile); // Pass the Google profile to serializeUser
    }
));

// Serialize user information into the session
passport.serializeUser((user, done) => {
    // Store minimal user information (e.g., user ID or Google ID) in the session
    // For this example, storing the whole profile (not recommended for production)
    done(null, user);
});

// Deserialize user information from the session
passport.deserializeUser((obj, done) => {
    // Fetch user details from DB based on the stored identifier if needed
    // For this example, the whole profile object was stored
    done(null, obj);
});

// Middleware to ensure user is authenticated
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
}

// --- Routes ---

// Route to initiate Google OAuth flow
app.get('/auth/google',
    passport.authenticate('google') // This redirects the user to Google
);

// Google OAuth Callback Route
// Google redirects the user here after successful authentication
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login-failed' }), // Authenticate session
    async (req, res) => { // Make handler async
        // Successful authentication!
        console.log('Successfully authenticated, user:', req.user?.displayName);

        // Save/Update user profile in DynamoDB
        const userProfile = req.user; // Passport attaches user profile here
        if (userProfile && userProfile.id) { // Ensure we have a user and ID (sub)
            const params = {
                TableName: tableName,
                Item: {
                    UserID: userProfile.id, // Use Google 'sub' as the UserID (Partition Key)
                    DataType: 'PROFILE',    // Sort Key for profile data
                    Email: userProfile.emails?.[0]?.value,
                    Name: userProfile.displayName,
                    GivenName: userProfile.name?.givenName,
                    FamilyName: userProfile.name?.familyName,
                    Picture: userProfile.photos?.[0]?.value,
                    LastLogin: new Date().toISOString(), // Add a last login timestamp
                },
            };

            try {
                await docClient.send(new PutCommand(params));
                console.log(`User profile saved/updated for UserID: ${userProfile.id}`);
            } catch (dbError) {
                console.error("Error saving user profile to DynamoDB:", dbError);
                // Decide if you want to block login on DB error or just log it
                // For now, we'll log and continue the redirect
            }
        } else {
            console.error("User profile data missing after authentication.");
            // Handle appropriately - maybe redirect to an error page?
        }

        // Redirect the user to the frontend success page
        // TODO: Update frontend URL if needed
        res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173/signin-success');
    }
);

// Simple route to check authentication status (optional)
app.get('/api/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ loggedIn: true, user: req.user }); // Send back user info
    } else {
        res.json({ loggedIn: false });
    }
});

// Logout Route
app.post('/api/auth/logout', (req, res, next) => {
    req.logout(function(err) { // req.logout requires a callback function
        if (err) { return next(err); }
        req.session.destroy((err) => { // Destroy the session
            if (err) {
                console.error("Error destroying session:", err);
                return res.status(500).json({ message: "Error logging out" });
            }
            res.clearCookie('connect.sid'); // Clear the session cookie
            console.log('User logged out and session destroyed.');
            res.status(200).json({ message: "Logged out successfully" });
        });
    });
});


// Basic route
app.get('/', (req, res) => {
    res.send('Backend server is running!');
});

const GSI_NAME = "WpmLeaderboardIndex"; // Store GSI name (matches Terraform)

// --- New Leaderboard Route ---
app.get('/api/leaderboard', async (req, res) => {
    const limit = 20; // Number of top scores to fetch

    const params = {
        TableName: gsiName,
        IndexName: GSI_NAME, // Query the GSI
        KeyConditionExpression: "#gsi_pk = :gsi_pk_val", // Query condition for the GSI partition key
        ExpressionAttributeNames: {
            "#gsi_pk": "GSIPK" // Placeholder for the GSI PK attribute name
        },
        ExpressionAttributeValues: {
            ":gsi_pk_val": "STAT_RECORD" // The static value we use for GSI PK
        },
        ScanIndexForward: false, // Sort descending (highest WPM first)
        Limit: limit // Get only the top N results
    };

    try {
        console.log("Querying leaderboard GSI:", JSON.stringify(params));
        const command = new QueryCommand(params);
        const data = await docClient.send(command);
        console.log("Leaderboard GSI query successful. Items received:", data.Items?.length);

        let leaderboardEntries = data.Items || [];

        // --- Option A: Name was Denormalized (included in STAT record) ---
        // If you stored 'Name' directly on the STAT record (as shown in the modified /api/stats),
        // the 'leaderboardEntries' already contain the name. No further action needed here.

        // --- Option B: Fetch Names Separately (if NOT denormalized) ---
        // Uncomment this block if you did *not* store 'Name' on the STAT record.
        /*
        if (leaderboardEntries.length > 0) {
            const userIds = [...new Set(leaderboardEntries.map(entry => entry.UserID))]; // Get unique UserIDs

            // Prepare keys for BatchGetItem to fetch PROFILE items
            const profileKeys = userIds.map(userId => ({
                UserID: userId,
                DataType: 'PROFILE'
            }));

            if (profileKeys.length > 0) {
                const batchGetParams = {
                    RequestItems: {
                        [tableName]: {
                            Keys: profileKeys,
                            ProjectionExpression: "UserID, #n", // Fetch only UserID and Name
                            ExpressionAttributeNames: { "#n": "Name" } // Alias for 'Name' attribute
                        }
                    }
                };
                console.log("Fetching user profiles for leaderboard:", JSON.stringify(batchGetParams));
                const batchGetCommand = new BatchGetItemCommand(batchGetParams);
                const profileData = await docClient.send(batchGetCommand);

                const profilesMap = new Map();
                profileData.Responses?.[tableName]?.forEach(profile => {
                    profilesMap.set(profile.UserID, profile.Name || 'Unknown User');
                });
                console.log("Profiles fetched:", profilesMap.size);


                // Add the fetched name to each leaderboard entry
                leaderboardEntries = leaderboardEntries.map(entry => ({
                    ...entry,
                    Name: profilesMap.get(entry.UserID) || 'Unknown User'
                }));
            }
        }
        */
        // --- End Option B ---


        res.status(200).json(leaderboardEntries);

    } catch (dbError) {
        console.error("Error querying leaderboard from DynamoDB GSI:", dbError);
        res.status(500).json({ message: 'Failed to fetch leaderboard data' });
    }
});



// Add near your other routes in server.js

// --- Route to get typing texts ---
// Example: GET /api/texts?theme=novel&limit=5
// Example: GET /api/texts?theme=technical
app.get('/api/texts', async (req, res) => {
    const { theme, limit } = req.query;

    if (!theme) {
        return res.status(400).json({ message: 'Missing required query parameter: theme' });
    }

    // Parse limit, default to fetching a reasonable number (e.g., 10) if not specified or invalid
    let queryLimit = parseInt(limit, 10);
    if (isNaN(queryLimit) || queryLimit <= 0) {
        queryLimit = 10; // Default limit
    }

    const params = {
        TableName: textsTableName,
        // Query by the Partition Key (Theme)
        KeyConditionExpression: "#th = :theme_val",
        ExpressionAttributeNames: {
            "#th": "Theme"
        },
        ExpressionAttributeValues: {
            ":theme_val": theme // The theme requested by the client
        },
        // Limit the number of items returned by the query itself
        Limit: queryLimit
        // We don't specify ScanIndexForward, so default is ascending by TextID.
        // If you want random texts, you'd fetch more than needed and randomize server-side.
    };

    try {
        console.log(`Querying texts for theme: ${theme}, limit: ${queryLimit}`);
        const command = new QueryCommand(params);
        const data = await docClient.send(command);
        console.log(`Found ${data.Items?.length || 0} texts for theme: ${theme}`);

        // Optional: If you fetched more than needed (e.g., Limit: 50) and want to randomize:
        // let items = data.Items || [];
        // if (items.length > queryLimit) {
        //   for (let i = items.length - 1; i > 0; i--) {
        //     const j = Math.floor(Math.random() * (i + 1));
        //     [items[i], items[j]] = [items[j], items[i]];
        //   }
        //   items = items.slice(0, queryLimit);
        // }
        // res.status(200).json(items);

        res.status(200).json(data.Items || []); // Return the items fetched (up to the limit)

    } catch (dbError) {
        console.error(`Error querying texts for theme ${theme}:`, dbError);
        res.status(500).json({ message: 'Failed to fetch typing texts' });
    }
});




// --- Route to get stats for the currently logged-in user ---
app.get('/api/user/stats', ensureAuthenticated, async (req, res) => {
    const userId = req.user?.id; // Get UserID from the authenticated session

    if (!userId) {
        // This shouldn't happen if ensureAuthenticated works, but good practice
        return res.status(401).json({ message: 'User not found in session' });
    }

    const params = {
        TableName: tableName,
        // Query the main table using the UserID (Partition Key)
        KeyConditionExpression: "#uid = :user_id AND begins_with(#dtype, :stat_prefix)",
        ExpressionAttributeNames: {
            "#uid": "UserID",
            "#dtype": "DataType" // Alias for the sort key
        },
        ExpressionAttributeValues: {
            ":user_id": userId,
            ":stat_prefix": "STAT#" // Filter for items where DataType starts with "STAT#"
        },
        // Return newest stats first based on the DataType (STAT#<ISO_DATE>)
        ScanIndexForward: false // Sort by Sort Key (DataType) descending
    };

    try {
        console.log(`Querying stats for UserID: ${userId}`);
        const command = new QueryCommand(params);
        const data = await docClient.send(command);
        console.log(`Found ${data.Items?.length || 0} stat items for UserID: ${userId}`);

        // The items are already sorted by date descending due to ScanIndexForward: false
        // If you wanted to sort by WPM here, you would do it after fetching:
        // const sortedByWpm = data.Items?.sort((a, b) => (b.WPM || 0) - (a.WPM || 0));
        // res.status(200).json(sortedByWpm || []);

        res.status(200).json(data.Items || []); // Return items sorted by date

    } catch (dbError) {
        console.error(`Error querying stats for UserID ${userId}:`, dbError);
        res.status(500).json({ message: 'Failed to fetch user stats' });
    }
});






// Route to save typing game stats
app.post('/api/stats', ensureAuthenticated, async (req, res) => {
    const { wpm, dateAchieved, textId } = req.body; // Get stats from request body
    const userId = req.user?.id; // Get UserID from the authenticated session
    const userName = req.user?.displayName; // Get user's name from session (optional denormalization)

    // Basic validation
    if (!userId || typeof wpm !== 'number' || wpm < 0 || !dateAchieved || !textId) { // Added wpm >= 0 check
        return res.status(400).json({ message: 'Missing required stat fields (userId, wpm, dateAchieved, textId)' });
    }

    // Use the dateAchieved for the sort key, ensuring it's in ISO format
    // If it's not already ISO, attempt to convert. Handle potential errors.
    let isoDate;
    try {
        isoDate = new Date(dateAchieved).toISOString();
    } catch (dateError) {
        console.error("Invalid date format received:", dateAchieved, dateError);
        return res.status(400).json({ message: 'Invalid date format for dateAchieved. Please use ISO 8601 format.' });
    }

    const params = {
        TableName: tableName,
        Item: {
            UserID: userId,
            DataType: `STAT#${isoDate}`, // Sort Key: STAT# followed by ISO date
            WPM: wpm,
            TextID: textId,
            DateAchieved: isoDate, // Store the date as an attribute as well

            // --- Add GSI Partition Key ---
            GSIPK: "STAT_RECORD", // Static value for the GSI partition

            // --- Optional: Denormalize User Name ---
            // Store the user's name directly on the stat record.
            // Pros: Faster leaderboard reads (no extra lookup).
            // Cons: Data duplication; if name changes, old records aren't updated.
            Name: userName || 'Unknown User' // Get name from passport user object
        },
    };

    try {
        await docClient.send(new PutCommand(params));
        console.log(`Stats saved for UserID: ${userId}, Date: ${isoDate}`);
        res.status(201).json({ message: 'Stats saved successfully', item: params.Item });
    } catch (dbError) {
        console.error("Error saving stats to DynamoDB:", dbError);
        res.status(500).json({ message: 'Failed to save stats' });
    }
});




// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
    console.log(`Frontend URL configured for CORS: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`Google OAuth Callback URL: ${CALLBACK_URL}`);
});
