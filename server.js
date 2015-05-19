var app = require('express')();
var express = require('express');
var http = require('http').Server(app);
var io = require('socket.io')(http, {path: '/public/socket.io'})
var _ = require('underscore');
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/client.html');
});
var userlist = [];

var UserModel = function(user, pw) {
  this._userName = user;
  this._pwd = pw;
  userlist.push(this);
}

UserModel.prototype = {
  getPwd: function() {
    return this._pwd;
  }
}

a = new UserModel("Fabi", "abc")
b = new UserModel("Simon", "abc")

function findUser(user) {
  return _.find(userlist, function(u){return u._userName === user});
}

function authenticate(username, pw) {
  var user = findUser(username);
  if (user === undefined || user.getPwd() !== pw)
    return false;
  return true;
}


io.on('connection', function(socket){
  socket.on('register', function(user,pw){
    io.emit('register_result', 1);
    var user = new UserModel(user, pw);
    socket.username = user._userName;
  });

  socket.on('login', function(user,pw){

  	if(authenticate(user, pw))
      io.emit('login_result',1);
    else
      io.emit('login_result',0);
  });
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});
