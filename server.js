var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

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

http.listen(3000, function(){
  console.log('listening on *:3000');
});
