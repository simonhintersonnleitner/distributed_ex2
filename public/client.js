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
      socket.emit('list_auctions');
      socket.on('list_auctions_result', function(res){
        console.log(res);
        $('#articleList').empty();
        res.forEach(function(auction){
          $('#articleList').append("<li>"+auction._article._name+" | "+auction._article._description+" | "+auction._article._regularPrice+"€");
          $('#articleList').append("<button class='bid' data-id="+auction._id+">Bieten</button>");
          $('#articleList').append("<input type='text' id='value_"+auction._id+"'></li>");
        });

        $('.bid').click(function() {
          var auctionId = $(this).data('id');
          var value = $('#value_'+auctionId).val();
          console.log("New Bid: " + auctionId +" " + value);
          socket.emit('new_bid', auctionId, value);
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



