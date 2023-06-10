if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
};

// Imports for all the node modules required for the script to work
const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const sqlite3 = require('sqlite3').verbose();

// Creates sql variable, so I don't have to constantly have to define new variables
let sql;

// Connects to sqlite database with user information
const db = new sqlite3.Database('./users.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
});

// Connects to passport config function and provides it the neccessary user info
const initializePassport = require('./pass-config');
initializePassport(passport, async (email) => {
    return new Promise((resolve, reject) => {
        sql = 'SELECT * FROM users WHERE email = ?';
        db.get(sql, [email], (err, row) => {
            if (err) return reject(err);
            if (!row) return resolve(null);
            return resolve({
                id: row.id,
                name: row.name,
                email: row.email,
                password: row.password,
            });
        });
    });
}, async (id) => {
    return new Promise((resolve, reject) => {
        sql = 'SELECT * FROM users WHERE id = ?';
        db.get(sql, [id], (err, row) => {
            if (err) return reject(err);
            if (!row) return resolve(null);
            return resolve({
                id: row.id,
                name: row.name,
                email: row.email,
                password: row.password
            });
        });
    });
});

// Starts majority of modules needed
app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

// Renders the index/main page of the site. Also sends authenticated variable to the html page.
app.get('/', (req, res) => {
    res.render('index.ejs', { authenticated: req.isAuthenticated() });
});

// Renders the login page
app.get('/login', (req, res) => {
    res.render('login.ejs');
});

// Logs into an account using passport.authenticate
app.post('/login', passport.authenticate('local',
    { failureRedirect: '/login',
      failureFlash: true }), function(req, res) {
        // Requests the remmember me box and if it is selected it adds a cookie to site that lasts for 30 days
        if (req.body.remember) {
          req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
        } else {
          req.session.cookie.expires = false; 
        }
      res.redirect('/');
});

// Renders the register page
app.get('/register', (req, res) => {
    res.render('register.ejs');
});

// Creates an account for the site
app.post('/register', async (req, res) => {
    try {
        // Hashes the inputted password
        const hashedPassword = await bcrypt.hash(req.body.PSW, 10);
        // Defines what information needs to be inputted into the database
        sql = 'INSERT INTO users(id, name, email, password, his1, his2, his3, his4, his5, counter) VALUES (?,?,?,?,?,?,?,?,?,?)';
        // Inputs user information into the database
        // UserID: date and time of account creation, Username/Email: Inputted info, Password: Hashed password
        // His1-5: empty string as user has no history yet, Counter: Starts as 1
        db.run(
            sql, 
            [
                Date.now().toString(), 
                req.body.usrna, 
                req.body.email, 
                hashedPassword,
                '',
                '',
                '',
                '',
                '',
                1
            ], 
            (err) => {
                if (err) return console.error(err.message);
            }
        );
        res.redirect('/login');
    } catch {
        res.redirect('/register');
    }
});

// Logs user out
app.delete('/logout', (req, res, next) => {
    req.logOut((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});

// Renders the profile page if the user is logged in
app.get('/profile', checkAuthenticated, (req, res) => {
    // Gets Id of user
    let id = req.user.id;

    // sqlite3 is asynchronus so to get the user history before sending it to the html doc, you have to create promises
    function _getHistory(n) {
        return new Promise((resolve, reject) => {
            sql = `SELECT his${n} FROM users WHERE id = ?`;
            db.get(sql, [id], (err, row) => {
                if (err) {
                    reject (err);
                } else {
                    resolve(row[`his${n}`]);
                };
            });
        });
    }
    Promise.all([
        _getHistory(1),
        _getHistory(2),
        _getHistory(3),
        _getHistory(4),
        _getHistory(5)
    ]).then(result => {
        res.render('profile.ejs', { 
            name: req.user.name,
            email: req.user.email,
            his1: result[0],
            his2: result[1],
            his3: result[2],
            his4: result[3],
            his5: result[4]
        });
    })
    .catch(error => {
        console.error(error.message);
    });
});

// Inserts search into user history
app.post('/history', (req, res) => {
    // Checks if user is logged in
    if (req.isAuthenticated()) {
        // Defines variables for counter, id and sql instruction
        let id = req.user.id;
        let counter;
        sql = 'SELECT counter FROM users WHERE id = ?';
        // As sqlite3 is asynchronus each function is nested, so that everything is done in order
        // Each user has a counter so that the script can know which his-row to edit
        // This gets the user's counter
        db.get(sql, [id], (err, row) => {
            if (err) return console.error(err.message);
            // If the counter is bigger than 5 it will reset it to one.
            if (row.counter > 5){
                counter = 1;
            } else {
                counter = row.counter;
            };

            // Updates whichever his-row with whatever was inputted
            sql = `UPDATE users SET his${counter} = ? WHERE id = ?`;
            db.run(sql, [req.body.search, id], function (err) {
                if (err) return console.error(err.message);
                
                // Updates the user's counter by one
                sql = `UPDATE users SET counter = ? WHERE id = ?`;
                db.run(sql, [(counter + 1), id], function (err) {
                    if (err) return console.error(err.message);

                });
            });
        });
    };
    // Sends 204 respones (meaning ok)
    res.sendStatus(204);
});

// Renders the advanced results page if user is logged in
app.get('/advresults', checkAuthenticated, (req, res) => {
    res.render('advresults.ejs');
});

// Allows the html to use javascript, css and images within the 'public' folder
app.use(express.static('public'));

// Function that checks if a user is authenticated. If the user is authenticated then it countinues, if not it redirects the user to the login page.
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.redirect('/login');
    }
}

// Hosts the site on port: 3000
app.listen(3000);