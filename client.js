var socket = io.connect('http://localhost', {path: "/public/socket.io"});

$(document).ready(function (){
	$('#login').click(function(){
    socket.emit('login', $('#user').val(),$('#pw').val());
  });
  socket.on('login_result', function(user,pw){
    console.log("Test");
  });
});

