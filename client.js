var socket = io.connect('http://localhost', {path: "/public/socket.io"});

$(document).ready(function (){
  $('#login').click(function(){
  socket.emit('login', $('#id').val(),$('#pw').val());
  });
  
  socket.on('login_result', function(user){
    console.log("Test");
  });

  $('#register').click(function(){
  console.log("Register");
  socket.emit('register', $('#id').val(),$('#pw').val());
  });

  socket.on('register_result', function(user){
    console.log("Test");
  });
});


  