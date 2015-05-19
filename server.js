var app = require('express')();
var express = require('express');
var http = require('http').Server(app);
var io = require('socket.io')(http, {path: '/public/socket.io'})

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/client.html');
});


io.on('connection', function(socket){
  socket.on('login', function(user,pw){
    console.log(user,pw);
  	if(user == "test" && pw == "password")
      io.emit('login_result',1);
    else
      io.emit('login_result',0);
  });
});

console.log(io);

http.listen(3000, function(){
  console.log('listening on *:3000');
});
