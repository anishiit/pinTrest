var express = require('express');
var router = express.Router();
const userModel = require("./users");
const postModel = require("./post");
const passport = require('passport');
const localStrategy = require('passport-local');
passport.use(new localStrategy(userModel.authenticate()));
const upload=require('./multer')

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/register', function(req, res, next) {
  res.render('register');
});
router.get('/profile',isLoggedIn, async function(req, res, next) {
  const user = await userModel
  .findOne({username: req.session.passport.user})
  .populate("posts")
  res.render('profile',{user});
});
router.get('/addPost',isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({username: req.session.passport.user});
  res.render('addPost',{user});
});
router.post('/createpost',isLoggedIn,upload.single("postimage"),async function(req,res,next){
  const user = await userModel.findOne({username: req.session.passport.user});
  const post = await postModel.create({
    user:user._id,
    title:req.body.title,
    description: req.body.description,
    image: req.file.filename
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});
router.get('/feed',isLoggedIn,async function(req,res,next){
  const user = await userModel.findOne({username:req.session.passport.user})
  const posts = await postModel.find()
  .populate("user")

  res.render("feed",{user,posts});
});

router.post('/register', function(req, res, next) {
 const data = new userModel({
  username: req.body.username, 
  email: req.body.email
 })
 userModel.register(data,req.body.password)
 .then(()=>{
  passport.authenticate("local")(req,res,function(){
    res.redirect("/profile")
  })
 })
});
router.post("/login",passport.authenticate("local",{
  failureRedirect:"/",
  successRedirect:"/profile"
}),function(req,res,next){});

router.post('/fileupload',isLoggedIn,upload.single("image"),async (req,res,next)=>{ 
 
const user = await userModel.findOne({username: req.session.passport.user});
user.profileImage=req.file.filename;
await user.save();
res.redirect("/profile");
  }
  
);
 
router.get("/logout",function(req,res,next){
  req.logout(function(err){
    if(err){return next(err);}
    res.redirect("/")
  })
});

function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
    res.redirect('/');
    
}
module.exports = router;
