import Express from 'express';
import passport from 'passport';
import * as bodyParser from 'body-parser';
import * as cookieParser from'cookie-parser';
import session from 'express-session';
import * as googleOauth from 'passport-google-oauth2';
// const fs = require('fs');
// const sqlite = require('sql.js');

// const filebuffer = fs.readFileSync('db/usda-nnd.sqlite3');

// const db = new sqlite.Database(filebuffer);

const app = Express();

// const sessionStore = new expressSessions.MemoryStore;
app.use(session({secret: 'somesecret', resave: false, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

const port = (process.env.PORT || 3001);
const host = (process.env.HOST || 'localhost');
const url = `http://${host}:${port}`
app.set('port', port);

// Express only serves static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
}

const CLIENT_ID = (process.env.CLIENT_ID || '');
const CLIENT_SECRET = (process.env.CLIENT_SECRET || '');
const config = {
  clientID: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  callbackURL: `${url}/auth/google/callback`,
  passReqToCallback   : true
}

passport.use(new googleOauth.Strategy(config, (req, accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }), (req, res) => {

});

app.get('/auth/google/callback', passport.authenticate('google', {failureRedirect: '/error', scope: ['profile'] }), (req, res) => {
  res.redirect('/private')
});

function authenticate() {
  return (req, res, next) => {
    if(!req.isAuthenticated() || !req.session.passport.user) {
      res.redirect('/auth/google');
    } else {
      next();
    }
  }
}

app.get('/', (req, res) => {
  res.send('Hello World! <a href="/private">Login</a>');
});

app.get('/private', authenticate(), (req, res) => {
  let profile = req.session.passport.user;
  res.send('Hello ' + profile.displayName + '! <a href="/logout">Lougout</a>\n');
});

app.get('/error', (req, res) => {
  res.send('Failed to authetnicate\n');
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect("/");
});

app.get('/api/food', (req, res) => {
  const param = req.query.q;

  if (!param) {
    res.json({
      error: 'Missing required parameter `q`',
    });
    return;
  }

  // WARNING: Not for production use! The following statement
  // is not protected against SQL injections.
  // const r = db.exec(
  //   `select * from entries
  //   limit 100`);

  res.json([]);
});

app.listen(port, () => {
  console.log(`Find the server at: ${url}`); // eslint-disable-line no-console
});
