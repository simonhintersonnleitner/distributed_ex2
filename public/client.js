var socket = io.connect('http://localhost', {path: "/public/socket.io"});

$(document).ready(function (){
  $('#login').click(function(){
  socket.emit('login', $('#user').val(),$('#pw').val());
  });

  socket.on('login_result', function(res){
    console.log("login_result " + res);
    $('#output').empty();
    if(res == 1)
    {
      $('#output').append("Login erflogreich!");
      socket.emit('list_articles');
      socket.on('list_articles_result', function(res){
        console.log(res);
        $('#articleList').empty();
        res.forEach(function(article){
          $('#articleList').append("<li>"+article._name+" | "+article._description+" | "+article._regularPrice+"€");
          $('#articleList').append("<button class='bid' data-id="+article._id+">Bieten</button>");
          $('#articleList').append("<input type='text' id='value_"+article._id+"'></li>");
        });

        $('.bid').click(function() {
          console.log("New Bid: " + $(this).data('id') +" " + $('#value_' + $(this).data('id')).val());
        });

      });
    }
   	else
   		$('#output').append("<p>Login nicht erflogreich!</p>");
  });



  $('#register').click(function(){
  socket.emit('register', $('#user').val(),$('#pw').val());
  });

  socket.on('register_result', function(res){
    console.log("register_result " + res);
    $('#output').empty();
    if(res == 1)
      $('#output').append("Registierung erflogreich!");
    else
      $('#output').append("<p>Registierung nicht erflogreich!</p>");
  });
});



