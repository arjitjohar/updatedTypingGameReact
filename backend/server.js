require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cors = require('cors');
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");

const app = express();
const PORT = process.env.PORT || 3000; // Backend port

// --- AWS SDK DynamoDB Setup ---
// TODO: Configure AWS region and credentials appropriately
// (e.g., via environment variables, IAM role)
const awsRegion = process.env.AWS_REGION || "us-east-1";
const dynamoClient = new DynamoDBClient({ region: awsRegion });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const tableName = "TypingGameUsers"; // The table name created by Terraform

// --- Middleware ---

// Body Parser for JSON requests
app.use(express.json());

// CORS Configuration
// Allow requests from the frontend development server
// TODO: Update origin in production
app.use(cors({
    origin: 'http://localhost:5173' || 'http://localhost:5173', // Allow frontend origin
    credentials: true // Allow cookies to be sent
}));

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

app.get('/api/env', (req, res) => {
    res.json({ 
        port: process.env.PORT,
        googleClientId: process.env.GOOGLE_CLIENT_ID,
        googleClientSecret: process.env.GOOGLE_CLIENT_SECRET
    });
});

// Route to save typing game stats
app.post('/api/stats', ensureAuthenticated, async (req, res) => {
    const { wpm, dateAchieved, textId } = req.body; // Get stats from request body
    const userId = req.user?.id; // Get UserID from the authenticated session

    // Basic validation
    if (!userId || typeof wpm !== 'number' || !dateAchieved || !textId) {
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
