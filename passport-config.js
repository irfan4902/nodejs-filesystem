const LocalStrategy = require('passport-local').Strategy;
import bcrypt from bcrypt;

function initialize(passport, getUserByUserName, getUserByID) {

    const authenticateUser = async (email, password, done) => {
        const user = getUserByUserName(email);
        if (user == null) {
            return done(null, false, { message: 'No user with that username' })
        }

        try {
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user)
            }
            else {
                return done(null, false, { message: 'Password incorrect' });
            };
        } catch (e) {
            return done(e);
        }
    }

    passport.use(new LocalStrategy({ username: 'username' }, authenticateUser));
    passport.serializeUser((user, done) => { done(null, user.id) });
    passport.deserializeUser((id, done) => { return done(null, getUserByUserName(id )) });
}

modules.exports = initialize;