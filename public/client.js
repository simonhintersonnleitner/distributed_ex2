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
       
        res.forEach(function(auction){
          $('#articleList').find("#row_"+auction._id).remove();
          $('#articleList').append("<tr id='row_"+auction._id+"''>");
          $('#articleList').find("#row_"+auction._id).append("<td>"+auction._article._name+"</td>");
          $('#articleList').find("#row_"+auction._id).append("<td>"+auction._article._description+"</td>");
          $('#articleList').find("#row_"+auction._id).append("<td>"+auction._article._regularPrice+" €</td>");
          $('#articleList').find("#row_"+auction._id).append("<td><div class='time' data-end="+auction._endsAt+">" + getRemaing(auction._endsAt)+"</div></td>");
          $('#articleList').find("#row_"+auction._id).append("<td><div class='form-inline'><input type='text'  id='value_"+auction._id+"' class='form-control'><button class='btn btn-default' id='bid' data-id="+auction._id+">Bid</button></div></td>");
          $('#articleList').find("#row_"+auction._id).append("<td><button class='btn btn-default' id='check' data-id="+auction._id+">Check</button></td>");
          $('#articleList').append("</tr>");

          //$('#articleList').append("<input type='text' id='value_"+auction._id+"'>");
          //$('#articleList').append("<button class='bid' data-id="+auction._id+">Bieten</button>");
          //$('#articleList').append("<button class='check' data-id="+auction._id+">CheckBid</button>");

          setInterval(function() {updateTime();}, 1000);
        });

        $('#bid').click(function() {
          var auctionId = $(this).data('id');
          var value = $('#value_' + auctionId).val();
          socket.emit('new_bid', auctionId, value);
          console.log("bid:" + auctionId + " " + value);
        });

        $('#check').click(function() {
          var auctionId = $(this).data('id');
          socket.emit('check_bid', auctionId);
        });

      });
    }
   	else
   		$('#output').append("<p>Login nicht erflogreich!</p>");
  });

  socket.on('new_bid_result', function(res){
    $('#output').empty();
    if(res == -1) {
      $('#output').append("Glückwunsch sie haben das niedrigste Einzelgebot!");
      console.log("Glückwunsch sie haben das niedrigste Einzelgebot!");
    }
    else if(res == 1) {
      $('#output').append("Sie haben ein Einzelgebot allerdings ist es zu hoch!");
      console.log("Sie haben ein Einzelgebot allerdings ist es zu hoch!");
    }
    else {
      $('#output').append("Es haben " + res + " Personen das gleiche Gebot wie sie!");
      console.log("Es haben " + res + " Personen das gleiche Gebot wie sie!");
    }
  });

   socket.on('check_bid_result', function(res){
    $('#output').empty();
    if(res == -1) {
      $('#output').append("Fehler es wurde keine Gebot abgegeben!");
      console.log("Fehler es wurde keine Gebot abgegeben!");
    }
    else if(res == 1) {
      $('#output').append("Glückwunsch sie haben aktuell das niedrigste Einzelgebot!");
      console.log("Glückwunsch sie haben aktuell das niedrigste Einzelgebot!"); 
    }
    else {
      $('#output').append("Leider haben Sie aktuell NICHT das niedrigste Einzelgebot!");
      console.log("Leider haben Sie aktuell NICHT das niedrigste Einzelgebot!");
    }
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
  return(days  +"d - "+ houres + ":"+ minutes + ":" + seconds );
}

function updateTime(){
  var remainingTime = getRemaing($('.time').data('end'));
  $('.time').empty();
  $('.time').append(remainingTime);

}

