var app = require('express')();
var express = require('express');
var http = require('http').Server(app);
var io = require('socket.io')(http, {path: '/public/socket.io'})
var _ = require('underscore');
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/client.html');
});
var userList = [];
var articleList = [];
var auctionList = [];

var UserModel = function(user, pw) {
  this._userName = user;
  this._pwd = pw;
  userList.push(this);
}

UserModel.prototype = {
  getPwd: function() {
    return this._pwd;
  }
}

var ArticleModel = function(name, description, price) {
  // this._id = _.max(articleList, function(article){ return article.id; }) + 1;
  this._id = articleList.length; //Gefährlich!!!!!
  this._name = name;
  this._description = description;
  this._regularPrice = price;
  this._imageUrl = "";
  articleList.push(this);
}
ArticleModel.prototype = {
  getArticleById: function(id) {
    return _.findWhere(articleList, {_id: id});
  }
}

var AuctionModel = function(articleId, beganAt, endsAt) {
  // this._id = _.max(articleList, function(article){ return article.id; }) + 1;
  this._id = auctionList.length; //Gefährlich!!!!!
  this._article = ArticleModel.prototype.getArticleById(articleId);
  this._beganAt = beganAt;
  this._endsAt = endsAt;
  this._bids = [];
  this._ended = false;
  auctionList.push(this);
}
AuctionModel.prototype = {
  getLiveAuctions: function() {
    return _.filter(auctionList, function(auc){ return auc._endsAt > Date.now(); });
  }
}

u1 = new UserModel("Fabi", "abc")
u2 = new UserModel("Simon", "abc")
a1 = new ArticleModel("Teller", "Schöner Teller", 5)
a2 = new ArticleModel("Oreo", "Lecker Keks", 0.4)
a2 = new ArticleModel("Bier", "hmm", 15)
au1 = new AuctionModel(0, Date.now(), Date.now() + 1000 * 60 * 1)
au2 = new AuctionModel(1, Date.now(), Date.now() + 1000 * 60 * 1)
au2 = new AuctionModel(2, Date.now() - 1000 * 60 * 50, Date.now() - 1000 * 60 * 5)

// console.log(articleList)
// console.log(auctionList)
// console.log(AuctionModel.prototype.getLiveAuctions());

function findUser(user) {
  return _.find(userList, function(u){return u._userName === user});
}

function authenticate(username, pw) {
  var user = findUser(username);
  if (user === undefined || user.getPwd() !== pw)
    return false;
  return true;
}


io.on('connection', function(socket){
  //Register
  socket.on('register', function(user,pw){
    io.emit('register_result', 1);
    var user = new UserModel(user, pw);
    socket.username = user._userName;
    console.log(socket.username)
  });
  //Login
  socket.on('login', function(user,pw){
  	if(authenticate(user, pw))
      io.emit('login_result', 1);
    else
      io.emit('login_result', 0);
  });
  //List Articles
  socket.on('list_auctions', function(){
    io.emit('list_auctions_result', AuctionModel.prototype.getLiveAuctions());
  });
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});
