var socket = io();
  $('#login').click(function(){
    socket.emit('login', $('#id').val(),$('#pw').val());
  });
  socket.on('login_complete', function(user,pw){
    $('#ouput').append($('<li>').text(user,pw));
  });