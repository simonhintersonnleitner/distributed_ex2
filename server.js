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
  findUser: function(user) {
    return _.find(userList, function(u){return u._userName === user});
  },
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

//AuctionModel
var AuctionModel = function(articleId, beganAt, endsAt) {
  // this._id = _.max(articleList, function(article){ return article.id; }) + 1;
  this._id = auctionList.length; //Gefährlich!!!!!
  this._article = ArticleModel.prototype.getArticleById(articleId);
  this._beganAt = beganAt;
  this._endsAt = endsAt;
  this._bids = [];
  this._ended = false;

  this.checkBid = function(bid){

  };

  this.endAuction = function(){
    this._ended = true;
    io.emit('auction_ended', this._id);

  };
  auctionList.push(this);
}

AuctionModel.prototype = {
  getLiveAuctions: function() {
    return _.filter(auctionList, function(auc){ return !auc._enden && auc._endsAt > Date.now(); });
  },
  getAuction: function(auctionId) {
    return _.find(auctionList, function(a){return a._id === auctionId});
  },
  newBid: function(auctionId, value, username) {
    var bid = new BidModel(value, username);
    var auction = AuctionModel.prototype.getAuction(auctionId);
    auction._bids.push(bid);

    //check bid
    var count = _.filter(auction._bids, function(b) {
      return b._value === bid._value;
    }).length;

    if (count === 1) {
      var winningBid = AuctionModel.prototype.getWinningBid(auction);

      if(winningBid._value === bid._value){
        return -1;
      }
    }
    return count;
  },
  getWinningBid: function(auction) {
    var sortedBids = _.sortBy(auction._bids, function(b){
        return b._value;
      });
    var winningBid = 'no single bid';

    for (var i = 0; i < sortedBids.length; i++) {
      var amount = _.filter(sortedBids, function(b){
        return b._value === sortedBids[i]._value;
      }).length;

      if ( amount === 1 ) {
        winningBid = sortedBids[i];
        return winningBid;

      }
    }
    return false;
  },
  checkBid: function(username, auctionId) {
    var user = UserModel.prototype.findUser(username);
    var auction = AuctionModel.prototype.getAuction(auctionId);
    var winningBid = AuctionModel.prototype.getWinningBid(auction);

    if (!_.find(auction._bids, function(b){ return b._user === user}))
      return -1;

    if(winningBid._user === user)
      return 1;

    return 0;
  },
  //check if auctions have ended
  checkForEndedAuctions: function() {
    for (var i = 0; i < auctionList.length; i++) {
      var ends = auctionList[i]._endsAt;
      var now = Date.now();

      if(now >= ends && !auctionList[i]._ended) {
        console.log('Time up!');
        console.log(auctionList[i]._id);
        auctionList[i].endAuction();
      }
    }
  }
}

var BidModel = function(value, username) {
  this._user = UserModel.prototype.findUser(username);
  this._value = value * 1;
}

function authenticate(username, pw) {
  var user = UserModel.prototype.findUser(username);
  if (user === undefined || user.getPwd() !== pw)
    return false;
  return true;
}

//socket functions
io.on('connection', function(socket){
  //Register
  socket.on('register', function(user,pw){
    io.emit('register_result', 1);
    var user = new UserModel(user, pw);
    socket.username = user._userName;

  });

  //Login
  socket.on('login', function(user,pw){
  	if(authenticate(user, pw)) {
      socket.username = user;
      io.emit('login_result', 1);
    }
    else
      io.emit('login_result', 0);
  });

  //List Articles
  socket.on('list_auctions', function(){
    io.emit('list_auctions_result', AuctionModel.prototype.getLiveAuctions());
  });

  //New bid
  socket.on('new_bid', function(auctionId, value) {
    io.emit('new_bid_result', AuctionModel.prototype.newBid(auctionId, value, socket.username));
  });

  //check bid
  socket.on('check_bid', function(auctionId) {
    io.emit('check_bid_result', AuctionModel.prototype.checkBid(socket.username, auctionId));
  });
});



//seeds
u1 = new UserModel("Fabi", "abc")
u2 = new UserModel("Simon", "abc")
a1 = new ArticleModel("Teller", "Schöner Teller", 5)
a2 = new ArticleModel("Oreo", "Lecker Keks", 0.4)
a3 = new ArticleModel("Bier", "hmm", 15)
au1 = new AuctionModel(0, Date.now(), Date.now() + 1000 * 60 )
au2 = new AuctionModel(1, Date.now(), Date.now() + 1000 * 25 )
au3 = new AuctionModel(2, Date.now() - 1000 * 60 * 50, Date.now() - 1000 * 60 * 5)
new AuctionModel.prototype.newBid(0, 5, "Fabi");
new AuctionModel.prototype.newBid(0, 6, "Simon");

//call checkForEndedAuctions every 1/2 sec
setInterval(function() {
  AuctionModel.prototype.checkForEndedAuctions();
}, 500);

http.listen(3000, function(){
  console.log('listening on *:3000');
});
