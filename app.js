const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine","ejs");
app.use(express.static(__dirname + "/Public"));

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
  }));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb+srv://admin-ismail:Test123@cluster0.fqdct.mongodb.net/userDB', {useNewUrlParser: true,useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

const userSchema = mongoose.Schema({
    username: String,
    password: String,
    email: String,
    postArray: [
        {
        productName: String,
        reusable: String,
        description: String,
        address: String,
        city: String,
        state: String,
        zip: Number
        }
    ]
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("user",userSchema);

passport.use(User.createStrategy());

app.get("/",function (req, res) {
    res.render("home");
});

passport.serializeUser(function(user, done) {
    done(null, user);
});
  
passport.deserializeUser(function(user, done) {
    done(null, user);
});

app.get("/about",function (req, res){
    res.render("about");
});

app.get("/about/:username",function (req, res) {
    let username =req.params.username;
    res.render("about-user-page",{username: username});
});

app.get("/home/:username",function(req,res){
    let username= req.params.username;
    res.render("home-user-page",{username: username});
});

// when login button in navbar clicked
app.post("/login",function (req, res) {
    res.render("login");
});

app.get("/login",function (req, res) {
    res.render("login");
});

app.get("/logout",function(req,res){
    req.logout();
    res.render("home");
});

app.post("/sign-up",function (req, res){
  
    User.register({username: req.body.username,email: req.body.email},req.body.password,function (err, user) {
        if(err) {
            console.log(err);
            res.redirect("/");
        }
        else {
            passport.authenticate("local")(req,res,function() {
                res.redirect("/login");
            });
        }
    });
});

app.post("/user-login",function(req,res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function(err){
        if(err)
            console.log(err);
        else {
            passport.authenticate("local")(req,res,function(){
                res.render("user-page",{username: user.username});
            });
        }
    });
});

// Posting from user page
app.post("/userform",function(req,res){
    
    var postItem = { 
        productName: req.body.productName,
        reusable: req.body.reusable,
        description: req.body.description,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        zip: req.body.zip
    };
 
    User.findOne({username: req.body.username},function(err,foundUser) {
        if(!err) {
           foundUser.postArray.push(postItem);
           foundUser.save();
           res.render("my-posts",{username:req.body.username,posts: foundUser.postArray});
        }
        else 
            console.log(err);
    });
});

app.get("/my-posts/:username",function(req,res) {
if(req.isAuthenticated()) { 
    let username = req.params.username;

    User.findOne({username: username},function(err,foundUser) {
        if(!err) {
            if(foundUser.postArray.length!=0)
                res.render("my-posts",{username: username,posts: foundUser.postArray});
            else 
                res.render("my-post-empty",{username: username});
        }   
        else
            console.log(err);
    });
  }
else
  res.redirect("/login");
});

app.get("/add-post/:username",function(req,res) {
    if(req.isAuthenticated()) {    
    let username = req.params.username;
    res.render("user-page",{username: username});
    }
    else 
        res.redirect("/login");
});

// admin page

app.get("/admin-login",function (req, res){
    res.render("admin-login-page");
});

app.post("/admin-login",function (req, res){
    if(req.body.username === "admin" && req.body.password === "evsproject"){
        User.find({},function (err, user){
            if(!err)
                res.render("admin-dashboard",{user: user});
        });
    }
    else 
        console.log("incorrect login");
});

let port = process.env.PORT;
if(port == null || port=="")
    port=3000;

app.listen(port,function() {
console.log("server started successfully");
});