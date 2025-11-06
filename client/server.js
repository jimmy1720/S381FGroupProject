const express = require('express');
const app = express();

app.set('view engine', 'ejs');

app.use(express.static('views'));
app.use("/css", express.static(__dirname + '/views/css'));

app.get("/", (req,res) => {
	res.status(200).render('index',{title:"Home"});	
});

app.get("/login", (req,res) => {
	res.status(200).render('login',{title:"Login"});	
});

app.get("/register", (req,res) => {
	res.status(200).render('register',{title:"Register"});	
});

const server = app.listen(process.env.PORT || 8099, () => { 
    const port = server.address().port;
    console.log(`Server is listening at port ${port}`); 
});
