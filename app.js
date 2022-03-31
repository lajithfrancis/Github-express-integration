const express = require('express')
const GitHub = require('github-api')

const app = express()
require('dotenv').config()
const port = process.env.PORT

const cookieParser = require('cookie-parser')
const expressSession = require('express-session')
const crypto = require('crypto')
const passport = require('passport')
const GithubStrategy = require('passport-github').Strategy
const { stringify } = require('flatted')
const _ = require('underscore')

let scopes = ['notifications', 'user:email', 'read:org', 'repo']
passport.use(
	new GithubStrategy(
		{
			clientID: process.env.GITHUB_CLIENT_ID,
			clientSecret: process.env.GITHUB_CLIENT_SECRET,
			callbackURL: 'http://localhost:3000/login/github/return',
			scope: scopes.join(' ')
		},
		function(token, tokenSecret, profile, cb) {
			return cb(null, { profile: profile, token: token })
		}
	)
)
passport.serializeUser(function(user, done) {
	done(null, user)
})
passport.deserializeUser(function(obj, done) {
	done(null, obj)
})
app.use(passport.initialize())
app.use(passport.session())

app.use(cookieParser())
app.use(
    expressSession({
        secret: crypto.randomBytes(64).toString('hex'),
        resave: true,
        saveUninitialized: true
    })
)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/logoff', function(req, res) {
	res.clearCookie(COOKIE)
	res.redirect('/')
})

app.get('/auth/github', passport.authenticate('github'))

app.get('/login/github/return',
	passport.authenticate('github', { successRedirect: '/set-cookie', failureRedirect: '/' })
)

app.get('/set-cookie', function(req, res) {
	let data = {
		user: req.session.passport.user.profile._json,
		token: req.session.passport.user.token
	}
  res.cookie('COOKIE', JSON.stringify(data))
	res.redirect('/')
})

app.get('/user', async function(req, res) {
let gh = new GitHub({
  token: JSON.parse(req.cookies.COOKIE).token
})
let data = {}
let me = gh.getUser()
let repos = await me.listRepos()
data.repos = repos.data
res.json(data);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})