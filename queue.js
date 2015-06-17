var app = require('express')();
var express = require('express');
var http = require('http').Server(app);
var _ = require('underscore');
var amqp = require('amqplib');
var when = require('when');
var io = require('socket.io')(http, {path: '/public/socket.io'})

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/client.html');
});

amqp.connect('amqp://localhost').then(function(conn) {

  io.on('connection', function(socket){
    socket.username = '';

    //From client
    socket.on('request', function(msg){
      return when(conn.createChannel().then(function(ch) {
        var q = 'request';
        var ok = ch.assertQueue(q, {durable: false});

        return ok.then(function(_qok) {
          ch.sendToQueue(q, new Buffer(msg));
          console.log(" [x] Rabbit sent '%s'", msg);
          return ch.close();
        });
      })).ensure(function() {  });;
    });

    //From Server
    process.once('SIGINT', function() {  });
    return conn.createChannel().then(function(ch) {
      console.log('haha')
      var ok2 = ch.assertQueue('response', {durable: false});

      ok2 = ok2.then(function(_qok) {
        return ch.consume('response', function(msg) {

          console.log(" [x] Rabbit received '%s'", msg.content.toString());

          var res = msg.content.toString();
          res = res.split(';');

          socket.emit('response', msg.content.toString());

          if (res[0] === 'login' && res[1] === 'ok'){
            socket.username = res[2];
          }
        }, {noAck: true});
      });

      return ok2.then(function(_consumeOk) {
        console.log(' Rabbit waiting for messages. ');
      });
    });
  });

}).then(null, console.warn);

http.listen(3000, function(){
  console.log('listening on *:3000');
});
