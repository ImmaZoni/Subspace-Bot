import express from 'express';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';
import cors from 'cors';
import { config } from 'dotenv';
import passport from 'passport';
import { Strategy, Profile } from 'passport-discord'; // Import Profile here
import { v4 as uuidv4 } from 'uuid';
import * as admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey.json';  // adjust path as needed

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

config();

let redisClient = createClient()
redisClient.connect().catch(console.error)
const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
    session({
        store: new RedisStore({
            client: redisClient,
            prefix: 'session:',
        }),
        secret: process.env.SESSION_SECRET ?? 'default-session-secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false, // For development, set to true in production
            maxAge: 2 * 60 * 60 * 1000, // 2 hours
        },
        genid: () => uuidv4(),
    })
);

// Passport.js setup
passport.serializeUser((user: any, done) => {
  done(null, user.id);  // Serialize user ID
});

passport.deserializeUser((id: string, done) => {
  db.collection('users').doc(id).get()
    .then((doc) => {
      if (doc.exists) {
        done(null, doc.data());
      } else {
        // No user found with the given ID
        done(null, null);
      }
    })
    .catch((err) => {
      done(err);
    });
});


const discordStrategy = new Strategy(
  {
    clientID: process.env.DISCORD_CLIENT_ID ?? '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET ?? '',
    callbackURL: process.env.DISCORD_REDIRECT_URI,
    scope: ['identify', 'email'],
  },
  async (accessToken: string, refreshToken: string, profile: Profile, done) => {
    const userRef = db.collection('users').doc(profile.id);
    const doc = await userRef.get();
    if (!doc.exists) {
      // New user, create in Firestore
      await userRef.set({ ...profile, id: profile.id });
    }
    // Done, pass the profile
    done(null, profile);
  }
);

passport.use(discordStrategy);

passport.use(discordStrategy);
app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/discord', passport.authenticate('discord'));
app.get(
    '/auth/discord/callback',
    passport.authenticate('discord', { failureRedirect: '/' }),
    function (req, res) {
        res.redirect('/dashboard');
    }
);

app.get('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
    });
    res.redirect('/');
});

app.post('/wallet', async (req, res) => {
    const { walletAddress } = req.body;
    const { user } = req;

    if (!walletAddress || !user) {
        return res.sendStatus(400);
    }

    // TODO: Verify wallet using polkadot.js here
    // TODO: If verified, save walletAddress to the user in your database
    res.sendStatus(200);
});

app.get('/dashboard', (req, res) => {
    if (!req.user) {
        return res.sendStatus(401);
    }
    // TODO: Fetch and send user dashboard data
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
