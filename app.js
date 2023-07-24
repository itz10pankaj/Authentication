require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
// const md5 = require('md5');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate=require('mongoose-findorcreate');
const app = express();
const port = 3000;

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect(`mongodb+srv://${process.env.ID}:${process.env.Password}@cluster0.kgiclwb.mongodb.net/Userdb`,{useNewUrlParser:true});


const userSchema = new mongoose.Schema({
    email: String,
    password: String ,
    googleId:String,
    secret:String
});

// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get('/', (req, res) => {
    res.render('home');
});

app.get("/auth/google",
    passport.authenticate('google', { scope: ["profile"] }));


app.get("/auth/google/secrets", 
passport.authenticate("google", { failureRedirect: "/login" }),
function(req, res) {
  // Successful authentication, redirect secrets.
res.redirect("/secrets");
    });


app.get('/login', (req, res) => {
    res.render('login');
});
app.get('/register', (req, res) => {
    res.render('register')
});



app.get('/secrets', (req, res) => {
    User.find({"secret":{$ne:null}},)
});

app.get('/submit', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('submit');
    } else {
        res.redirect('/login');
    }
});

// app.post('/submit', (req, res) => {
//     const submittedSecret = req.body.secret;
//     console.log(req.user.id);
//     User.findById(req.user.id).then((foundUser) => {
//         if(foundUser){
//             foundUser.secret = submittedSecret;
//             foundUser.save().then(() => {
//                 res.redirect('/secrets');
//             }).catch((err) => {
//                 console.log(err);
//             });
//         }
//     }).catch((err) => {
//         console.log(err);
//     });
// });

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/');
        }
    });
});


app.post('/register', (req, res) => {
    User.register({ username: req.body.username }, req.body.password).then((user) => {
        passport.authenticate('local')(req, res, () => {
            res.redirect('/secrets');
        });
    }).catch((err) => {
        console.log(err);
        res.redirect('/register');
    });

    // bcrypt.hash(req.body.password, saltRounds).then((hash) => {
    //     const newUser = new User({
    //         email: req.body.username,
    //         password: hash
    //     });

    //     newUser.save().then(() => {
    //         res.render('secrets');
    //     }).catch((err) => {
    //         res.send(err);
    //     });
    // }).catch((err) => {
    //     console.log(err);
    // });

    // const newUser = new User({
    //     email: req.body.username,
    //     password: md5(req.body.password)
    // });

    // newUser.save().then(() => {
    //     res.render('secrets');
    // }).catch((err) => {
    //     res.send(err);
    // });
});


app.post('/login', (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err) => {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets');
            });
        }
    });



    // const username = req.body.username;
    // const password = req.body.password;

    // User.findOne({email: username}).then((foundUser) => {     
    //     if(foundUser){
    //         bcrypt.compare(password, foundUser.password).then((result) => {
    //             if(result === true){
    //                 res.render('secrets');
    //             }else{
    //                 res.send('Password is incorrect');
    //             }
    //         }).catch((err) => {
    //             console.log(err);
    //         });
    //     }else{
    //         res.send('User not found');
    //     }
    // }).catch((err) => {
    //     console.log(err);
    // })
});


app.listen("3000",function(){
    console.log("port3000")
})

