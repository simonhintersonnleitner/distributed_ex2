var socket = io.connect('http://localhost', {path: "/public/socket.io"});

$(document).ready(function (){
  $('#login').click(function(){
  socket.emit('login', $('#user').val(),$('#pw').val());
  });

  $('#login').click(function(){
  socket.emit('login', $('#user').val(),$('#pw').val());
  });

  socket.on('login_result', function(res){
    console.log("login_result " + res);
    $('#output').empty();
    if(res == 1)
    {
      $('#login').prop( "disabled", true );
      $('#register').prop( "disabled", true );

      $('#output').append("Login erflogreich!");

      socket.emit('list_auctions');
      socket.on('list_auctions_result', function(res){
        console.log(res);
        $('#articleList').empty();
        res.forEach(function(auction){
          $('#articleList').append("<li>"+auction._article._name+" | "+auction._article._description+" | "+auction._article._regularPrice+"€");
          $('#articleList').append("<button class='bid' data-id="+auction._id+">Bieten</button>");
          $('#articleList').append("<input type='text' id='value_"+auction._id+"'>");
          $('#articleList').append("<div class='time' data-end="+auction._endsAt+">" + getRemaing(auction._endsAt)+"</div></li>");
          setInterval(function() {updateTime();}, 1000);
        });

        $('.bid').click(function() {
          var auctionId = $(this).data('id');
          var value = $('#value_'+auctionId).val();
          console.log(value);
          console.log("New Bid: " + auctionId +" " + value);
          socket.emit('new_bid', auctionId, value);
        });

      });
    }
   	else
   		$('#output').append("<p>Login nicht erflogreich!</p>");
  });

  socket.on('new_bid_result', function(res){
    console.log(res);
    if(res == -1)
      console.log("Glückwunsch sie haben das niedrigste Einzelgebot!");
    else if(res == 1)
      console.log("Sie haben ein Einzelgebot allerdings ist es zu hoch!");
    else
      console.log("Es haben " + res + " Personen das gleiche Gebot wie sie!");
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
      $('#output').append("Registierung nicht erflogreich!");
  });
});

function getRemaing(dateString){
  var date1 = new Date();
  var date2 = new Date(dateString);
  var diff = new Date(date2.getTime() - date1.getTime());
  var days = diff.getUTCDate()-1;
  var seconds = diff.getUTCSeconds();
  var houres = diff.getUTCHours();
  var minutes = diff.getUTCMinutes()
  return("Zeit verbleibend: Tage: "+  days  +" Stunden: "+ houres + " Minuten: "+ minutes + " Sekunden: " + seconds );
}

function updateTime(){
  var remainingTime = getRemaing($('.time').data('end'));
  $('.time').empty();
  $('.time').append(remainingTime);
  
}

