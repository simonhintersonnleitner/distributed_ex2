var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/client.html');
});
var userlist = [];

var UserModel = function(user, pw) {
  this._userName = user;
  this._pwd = pw;
  userlist.push(this);
}


io.on('connection', function(socket){
  socket.on('register', function(user,pw){
    console.log(user,pw);
    io.emit('register_result',1);
    var user = new UserModel(user, pw);
    socket.username = user._userName;
    console.log(userlist)
  });

  socket.on('login', function(user,pw){
    console.log(user,pw);
  	if(user == "test" && pw == "password")
      io.emit('login_result',1);
    else
      io.emit('login_result',0);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
