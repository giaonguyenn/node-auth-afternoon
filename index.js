const express = require("express");
const session = require("express-session");
const passport = require("passport");
const strategy = require("./strategy.js");
const request = require("request");

const app = express();

const port = 3000;

app.use( session ({
	secret: "?",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(strategy);
//configure passport's methods, these get called after a succesful login and before success redirect
passport.serializeUser((user, done) => {
	const {_json} = user;
	done(null, { clientID: _json.clientID, email: _json.email, name: _json.name, followers: _json.followers_url });
}); 
//use this to pick what properties you want from the returned user object
passport.deserializeUser((obj, done) => {
	done(null, obj);
});
//execute any necessary logic on the new version of the user object (when you call done(null, {}); in serializeUser)

/////////////////Endpoints/////////////////
app.get("/login",
	passport.authenticate("auth0", {
		successRedirect: '/followers', 
		failureRedirect: '/login', 
		failureFlash: true, connection: 'github' 
	})
	//pass in strategy type (auth0) and configuration object
	//specify in configuration object the success and failure redirects, turn failure flash on and force connection type to wherever (GitHub, other social media platforms)
);
app.get("/followers", (req, res, next) => {
	if(req.user) {
		const FollowersRequest = {
			url: req.user.followers,
			headers: {
				"User-Agent": req.user.clientID
			}
		};

		request(FollowersRequest, (error, response, body) => {
			res.status(200).send(body);
		});
	} else {
		res.redirect("/login");
	} 
});

app.listen(port, () => {console.log(`Server listening on port ${port}`);
});