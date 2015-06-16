var socket = io.connect('http://localhost', {path: "/public/socket.io"});

$(document).ready(function (){
  $('#login').click(function(){
    login();

  });

  $('#pw').keydown(function(e) {
    if (e.keyCode == 13) {
        login();
    }
  });

  $('#login').click(function(){
    socket.emit('login', $('#user').val(),$('#pw').val());
  });

  socket.on('login_result', function(res){
    console.log("login_result " + res);
    $('#output').empty();
    if(res == 1)
    {
      // $('#login').prop( "disabled", true );
      // $('#register').prop( "disabled", true );
      $('#login-form').hide();
      $('#output').append("Login erflogreich!");
      $('#output').removeClass('alert-warning');
      $('#output').addClass('alert-success');
      socket.emit('list_auctions');
    }
   	else
   		$('#output').append("<p>Login nicht erflogreich!</p>");
  });

  socket.on('list_auctions_result', function(res){
        console.log("res")
        console.log(res);

        res.forEach(function(auction){
          $('#articleList').find('#output').remove();
          $('#articleList').find("#row_"+auction._id).remove();
          $('#articleList').append("<tr id='row_"+auction._id+"''>");
          $('#articleList').find("#row_"+auction._id).append("<td>"+auction._article._name+"</td>");
          $('#articleList').find("#row_"+auction._id).append("<td>"+auction._article._description+"</td>");
          $('#articleList').find("#row_"+auction._id).append("<td>"+auction._article._regularPrice+" €</td>");

          $('#articleList').find("#row_"+auction._id).append("<td><div class='time' id='time_"+auction._id+"' data-end="+auction._endsAt+">" + getRemaing(auction._endsAt)+"</div></td>");
          $('#articleList').find("#row_"+auction._id).append("<td><div class='form-inline' id='bidform_"+auction._id+"'><input type='text'  id='value_"+auction._id+"' data-id="+auction._id+" class='form-control bid_value'><button class='btn btn-default bid' data-id="+auction._id+">Bid</button></div></td>");
          $('#articleList').find("#row_"+auction._id).append("<td><button class='btn btn-default check' id='check_"+auction._id+"' data-id="+auction._id+">Check</button></td>");
          $('#articleList').append("</tr>");

          setInterval(function() {updateTime(auction._id);}, 500);

        });

        if(res.length == 0){
          $('#articleList').find('#output').remove();
          $('#articleList').append('<tr id=output>');
          $('#articleList').find('#output').append('<td>no runnig auction found!</td><td></td><td></td><td></td><td></td><td></td>')
        }


        $('.bid').click(function() {
          bid(this);
        });

        $('.bid_value').keydown(function(e) {
          if (e.keyCode == 13) {
              bid(this);
          }
        });

        $('.check').click(function() {
          var auctionId = $(this).data('id');
          socket.emit('check_bid', auctionId);
        });
  });
  socket.on('new_bid_result', function(res){
    $('#output').empty();
    if(res == -1) {
      $('#output').append("Glückwunsch Sie haben das niedrigste Einzelgebot!");
      console.log("Glückwunsch Sie haben das niedrigste Einzelgebot!");
    }
    else if(res == 1) {
      $('#output').append("Sie haben ein Einzelgebot allerdings ist es zu hoch!");
      console.log("Sie haben ein Einzelgebot allerdings ist es zu hoch!");
    }
    else {
      $('#output').append("Es haben " + res + " Personen das gleiche Gebot wie Sie!");
      console.log("Es haben " + res + " Personen das gleiche Gebot wie Sie!");
    }
  });

   socket.on('check_bid_result', function(res){
    $('#output').empty();

    if(res == -1) {
      $('#output').append("Fehler es wurde keine Gebot abgegeben!");
      console.log("Fehler es wurde keine Gebot abgegeben!");
    }
    else if(res == 1) {
      $('#output').append("Glückwunsch Sie haben aktuell das niedrigste Einzelgebot!");
      console.log("Glückwunsch Sie haben aktuell das niedrigste Einzelgebot!");
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

  socket.on('auction_ended', function(auctionId){
    console.log("auction_ended id:" + auctionId);
    $('#time_' + auctionId).remove();
    $('#bidform_' + auctionId).remove();
    $('#check_' + auctionId).remove();
    $('#row_' + auctionId).find('td').eq(3).empty();
    $('#row_' + auctionId).find('td').eq(3).append("Time is over!")
  });

  socket.on('win_result', function(res){
    console.log("Winning" + res);
    $('#row_' + res).find('td').eq(4).append("You have won this auction!")
  });

});

function login() {
  socket.emit('login', $('#user').val(),$('#pw').val());
}

function bid(that) {
  var auctionId = $(that).data('id');
  var value = $('#value_' + auctionId).val();
  socket.emit('new_bid', auctionId, value);
  console.log("bid:" + auctionId + " " + value);
  $('.bid_value').val("");
}

function getRemaing(dateString){
  var date1 = new Date();
  var date2 = new Date(dateString);
  var diff = new Date(date2.getTime() - date1.getTime());

  var days = diff.getUTCDate()-1;
  var seconds = diff.getUTCSeconds();
  var houres = diff.getUTCHours();
  var minutes = diff.getUTCMinutes()
  
  return(days  +"d - "+ ('0' + houres).slice(-2) + ":"+ ('0' + minutes).slice(-2) + ":" + ('0' + seconds).slice(-2));
}

function updateTime(auctionId){
  var remainingTime = getRemaing($('#time_' + auctionId).data('end'));
  $('#time_' + auctionId).empty();
  $('#time_' + auctionId).append(remainingTime);

}

