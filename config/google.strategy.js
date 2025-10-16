const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email']
}, async function validate(accessToken, refreshToken, profile, done) {
    done(null, {
        fullName: profile.displayName,
        email: profile.emails[0].value
    });
}));

module.exports = passport;
