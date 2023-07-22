require('dotenv').config();
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
const bcrypt = require('bcrypt');
const encrpty=require("mongoose-encryption");
const md5=require("md5");

const app=express();
app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
    extended:true
}));

mongoose.connect(`mongodb+srv://${process.env.ID}:${process.env.Password}@cluster0.kgiclwb.mongodb.net/Userdb`,{useNewUrlParser:true});
// const userSchema={
//     email:String,
//     password:String
// }; 

const userSchema=new mongoose.Schema({
    email:String,
    password:String
});

userSchema.plugin(encrpty,{secret:process.env.secret,encryptedFields: ['password']});

const User=new mongoose.model("User",userSchema);

app.get("/",function(req,res){
    res.render("home");
});
app.get("/login",function(req,res){
    res.render("login");
});
app.get("/register",function(req,res){
    res.render("register");
});


app.post("/register",function(req,res){
const newUser=new User({
    email:req.body.username,
    password:md5(req.body.password)
});
newUser.save().then(()=>{
    res.render("secrets");
}).catch((err)=>{
    res.send(err);
});
})


app.post("/login",function(req,res){
    const username = req.body.username;
    const password = md5(req.body.password);

    User.findOne({email: username}).then((foundUser) => {     
        if(foundUser){
            bcrypt.compare(password, foundUser.password).then((result) => {
                if(result === true){
                    res.render("secret");
                }else{
                    res.send('Password is incorrect');
                }
            }).catch((err) => {
                console.log(err);
            });
        }else{
            res.send('User not found');
        }
    }).catch((err) => {
        console.log(err);
    })
})





 



app.listen(3000,function(){
    console.log("local host 3000");
})
