

//var socket = io.connect('http://localhost', { resource: 'public/socket.io' });
var socket = io.connect('http://localhost', {path: "/public/socket.io"});
//var socket = io();


$(document).ready(function (){
	$('#login').click(function(){
    socket.emit('login', $('#id').val(),$('#pw').val());
  });
  socket.on('login_result', function(user,pw){
    console.log("Test");
  });
});
  