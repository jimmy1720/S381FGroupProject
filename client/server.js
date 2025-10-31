const express = require('express');
const app = express();

app.set('view engine', 'ejs');

app.get("/css/:file", (req,res) => {
	res.sendFile(__dirname + '/views/css/' + req.params.file);
});

app.get("/", (req,res) => {
	res.status(200).render('index',{title:"Home"});	
});

app.get("/login", (req,res) => {
	res.status(200).render('login',{title:"Login"});	
});

app.get("/register", (req,res) => {
	res.status(200).render('register',{title:"Register"});	
});

app.listen(process.env.PORT || 8099);
