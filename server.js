var _ = require('underscore');
var amqp = require('amqplib');
var when = require('when');

var AuctionModel;
var userList = [];
var articleList = [];
var auctionList = [];

amqp.connect('amqp://localhost').then(function(conn) {
  //Send message to Queue
  function send(msg){
    return when(conn.createChannel().then(function(ch) {
      var q = 'response';
      var ok = ch.assertQueue(q, {durable: false});

      return ok.then(function(_qok) {
        ch.sendToQueue(q, new Buffer(msg));
        console.log(" [x] Server sent '%s'", msg);
        return ch.close();
      });
    })).ensure(function() { });;
  };

  //User model
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

  //article model
  var ArticleModel = function(name, description, price) {
    if(articleList.length > 0) {
      this._id = articleList[articleList.length - 1]._id + 1;
    }
    else {
      this._id = 0;
    }
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
  AuctionModel = function(articleId, beganAt, endsAt) {
      if(auctionList.length > 0) {
      this._id = auctionList[auctionList.length - 1]._id + 1;
    }
    else {
      this._id = 0;
    }
    this._article = ArticleModel.prototype.getArticleById(articleId);
    this._beganAt = beganAt;
    this._endsAt = endsAt;
    this._bids = [];
    this._ended = false;

    this.endAuction = function(){
      this._ended = true;
      send('endAuction;' + 'broadcast;' + this._id);
      this.notifyWinner();
    };

    this.notifyWinner = function(){
      var winningBid = AuctionModel.prototype.getWinningBid(this);
        //is there a winningBid with a user?
      if(winningBid._user) {
        //is the user connected?
        send('winAuction;' + winningBid._user._userName + ';' + this._id);
      }
      else { //Restart auction
        var auction = new AuctionModel(this._article._id, Date.now(), Date.now() + 1000 * 60 * 1);
        send('newAuction;' + 'broadcast;' + auction._id);
      }
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
      var auction = AuctionModel.prototype.getAuction(auctionId);

      if(!auction._ended || value > 0 || !isNaN(parseFloat(value)) ){
        var bid = new BidModel(value, username);
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
      }
      return -2;
    },
    getWinningBid: function(auction) {
      var sortedBids = _.sortBy(auction._bids, function(b){
          return b._value;
      });

      var winningBid = false;

      for (var i = 0; i < sortedBids.length; i++) {
        var amount = _.filter(sortedBids, function(b){
          return b._value === sortedBids[i]._value;
        }).length;

        if ( amount === 1 ) {
          winningBid = sortedBids[i];
          break;
        }
      }
      return winningBid;
    },
    checkBid: function(username, auctionId) {
      var user = UserModel.prototype.findUser(username);
      var auction = AuctionModel.prototype.getAuction(auctionId);
      var winningBid = AuctionModel.prototype.getWinningBid(auction);

      if (!_.find(auction._bids, function(b){ return b._user === user}))
        return -1; //no bid placed

      if(winningBid._user === user)
        return 1;//won

      return 0;//lost
    },
    //check if auctions have ended
    checkForEndedAuctions: function() {
      for (var i = 0; i < auctionList.length; i++) {
        var ends = auctionList[i]._endsAt;
        var now = Date.now();

        if(now >= ends && !auctionList[i]._ended) {
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

/*
#############
####SEEDS####
#############
*/

  u1 = new UserModel("Fabi", "abc")
  u2 = new UserModel("Simon", "abc")
  a1 = new ArticleModel("Teller", "Schöner Teller", 5)
  a2 = new ArticleModel("Oreo", "Lecker Keks", 0.4)
  a3 = new ArticleModel("Bier", "hmm", 15)
  au1 = new AuctionModel(0, Date.now(), Date.now() + 1000 * 20 )
  au2 = new AuctionModel(1, Date.now(), Date.now() + 1000 * 45 )
  au3 = new AuctionModel(2, Date.now() - 1000 * 60 * 50, Date.now() - 1000 * 60 * 1)
  new AuctionModel.prototype.newBid(0, 5, "Fabi");
  new AuctionModel.prototype.newBid(0, 6, "Simon");
  new AuctionModel.prototype.newBid(1, 7, "Fabi");
  new AuctionModel.prototype.newBid(1, 6, "Simon");


/*
#############
##RABBITMQ###
##Interface##
#############
*/


  process.once('SIGINT', function() {  });
  return conn.createChannel().then(function(ch) {

    var ok = ch.assertQueue('request', {durable: false});

    ok = ok.then(function(_qok) {
      return ch.consume('request', function(msg) {

        console.log(" [x] Server received '%s'", msg.content.toString());
        var res = msg.content.toString();

        res = res.split(';');

        if(res[2])
          res[2] = JSON.parse(res[2]);

        //login
        if(res[0].toString() === 'login'){
          if(authenticate(res[2]['user'], res[2]['pw'])) {
            var user = UserModel.prototype.findUser(res[2]['user']);
            send('login;' + res[2]['user'] + ';ok;');
          }
          else{
            send('login;' + res[2]['user'] + ';denied;');
          }
        }//Register
        else if(res[0].toString() === 'register') {
          new UserModel(res[2]['user'], res[2]['pw']);
          send('register;' + res[2]['user'] + ';ok;');
        }//new Bid
        else if(res[0].toString() === 'newBid') {
          var result = AuctionModel.prototype.newBid(res[2]['auctionId'], res[2]['value'], res[1]);
          send('newBid;' + res[1] + ';' + result + ';');
        }//check Bid
        else if(res[0].toString() === 'checkBid') {
          var result = AuctionModel.prototype.checkBid(res[1], res[2]['auctionId']);
          send('checkBid;' + res[1] + ';' + result + ';');
        }//get Auctions
        else if(res[0].toString() === 'getAuctions') {
          var auctions = JSON.stringify(AuctionModel.prototype.getLiveAuctions());
          send('auctions;' + res[1] + ';' + auctions);
        }
      }, {noAck: true});
    });

    return ok.then(function(_consumeOk) {
      console.log(' Server waiting for messages. ');
    });
  });

}).then(null, console.warn);

//call checkForEndedAuctions every 1/2 sec
  setInterval(function() {
    AuctionModel.prototype.checkForEndedAuctions();
    console.log('check')
  }, 500);
