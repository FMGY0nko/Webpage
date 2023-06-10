// Imports node modules
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();

// Connects to sqlite3 database
const db = new sqlite3.Database('./users.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
});

// Configures passport
function initialize(passport, getUserByEmail, getUserById) {
    const authenticateUser = async (email, password, done) => {
        const sql = 'SELECT * FROM users WHERE email = ?';
        db.get(sql, [email], async (err, user) => {
            if (err) return done(err);
            if (!user) {
                return done(null, false, { message: 'No user with that email' })
            }

            try {
                if (await bcrypt.compare(password, user.password)) {
                    return done(null, user)
                } else {
                    return done(null, false, { message: 'Password Incorrect' }) 
                }
            } catch (e) {
                return done(e)
            }
        });
    }

    passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
    passport.serializeUser((user, done) => done(null, user.id))
    passport.deserializeUser((id, done) => { 
        const sql = 'SELECT * FROM users WHERE id = ?';
        db.get(sql, [id], (err, user) => {
            if (err) return done(err);
            return done(null, user);
        });
    })
}

module.exports = initialize