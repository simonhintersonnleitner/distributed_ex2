var socket = io.connect('http://localhost', {path: "/public/socket.io"});
var loggedIn = false;

$(document).ready(function (){

  $('#logout').hide();
  $('#header').hide();


  $('#login').click(function(){
    console.log('login');
    login();
  });

  $('#pw').keydown(function(e) {
    if (e.keyCode == 13) {
      login();
    }
  });

  $('#register').click(function(){
    register
    socket.emit('register', $('#user').val(),$('#pw').val());
  });

  $('#logout').click(function(){
    console.log('logout');
    logout();
  });

  socket.on('disconnect', function(res){
    loggedIn = false;
    changeOutputText("Conncection lost!","danger");
    hideForLogOut();
  });

  socket.on('response',function(res){
    l
    var split_result = res.split(';');

    if(split_result[0]){
      if(split_result[0] == 'login'){
        if(split_result[1] == 'ok'){
          loggedIn = true;
          $('#login').hide();
          $('#register').hide();
          $('#form_user').hide();
          $('#form_pw').hide();
          $('#logout').show();
          changeOutputText("Login successfull!","success");
          getRunningAuctions();
        }else{
          changeOutputText("Login not successfull!","danger");
        }
      }else if(split_result[0] == 'logout'){
        if(split_result[1] == 'ok'){
          changeOutputText("You have been logged out!","warning");
          hideForLogOut();
        }else{
          changeOutputText("Logout failed!","danger");
        }
      }else if(split_result[0] == 'auctions'){
        printAuctions(JSON.parse(split_result[1]));
        console.log('auctions are commings!' + split_result[1]);
      }else if(split_result[0] == 'register'){
        if(split_result[1] == 'ok'){
          console.log('Logout erfolgreich');
          loggedIn = true;
          changeOutputText("Registration success",'success');
        }else{
          changeOutputText("Registration failed!",'danger');
        }
      }else if(split_result[0] == 'auction_ended'){
        console.log("auction_ended id:" + auctionId);
        $('#time_' + auctionId).remove();
        $('#bidform_' + auctionId).remove();
        $('#check_' + auctionId).remove();
        $('#row_' + auctionId).find('td').eq(3).empty();
        $('#row_' + auctionId).find('td').eq(3).append("Time is over!");
      }else if(split_result[0] == 'win_result'){
        if(loggedIn)
          $('#row_' + res).find('td').eq(4).append("You have won this auction!");
      }else if(split_result[0] == 'new_auction'){
        addNewAuction(JSON.parse(split_result[1]));
      }else if(split_result[0] == 'new_bid_result'){
        $('#output').empty();
        if(res == -1) {
          changeOutputText("Congratulation you have the lowest single-bid!",'success');
        }
        else if(res == 1) {
          changeOutputText("You have an single-bid but its to high",'warning');
        }
        else if(res == -2) {
          changeOutputText("The auction ist timed out or the bid is invalid",'danger');
        }
        else {
          changeOutputText(res + " other people have the same bid as you!",'warning');
        }
      }else if(split_result[0] == 'check_bid_result'){
        $('#output').empty();
        if(res == -1) {
          $('#output').append("Fehler es wurde keine Gebot abgegeben!");
          console.log("Fehler es wurde keine Gebot abgegeben!");
        }
        else if(res == 1) {
          $('#output').append("Glückwunsch Sie haben aktuell das niedrigste Einzelgebot!");
          console.log("Glückwunsch Sie haben aktuell das niedrigste Einzelgebot!");
        }
        else if(res == -2) {
          $('#output').append("<insert text here>");
          console.log("Glückwunsch Sie haben aktuell das niedrigste Einzelgebot!");
        }
        else {
          $('#output').append("Leider haben Sie aktuell NICHT das niedrigste Einzelgebot!");
          console.log("Leider haben Sie aktuell NICHT das niedrigste Einzelgebot!");
        }
      }
    }
  });

});

function addNewAuction(auction) {
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
  setInterval(function() {updateTime(auction._id);}, 1000);
  activateButtons();
}

function activateButtons(){
  $('.bid').off();
  $('.bid').click(function() {
    bid(this);
  });

  $('.bid_value').keydown(function(e) {
    if (e.keyCode == 13) {
        bid(this);
    }
  });
  $('.check').off();
  $('.check').click(function() {
    var auctionId = $(this).data('id');
    socket.emit('request','check_bid;id=' + auctionId);
  });
}

function printAuctions(auctions){
  if(auctions.length === 0){
    $('#articleList').find('#output').remove();
    $('#articleList').append('<tr id=output>');
    $('#articleList').find('#output').append('<td>no runnig auction found!</td><td></td><td></td><td></td><td></td><td></td>');
  }else{
    $('#header').show();
    auctions.forEach(function(auction){
      addNewAuction(auction);
    });
  }
}

function login() {
  var user = {
    user: $('#user').val(),
    pw: $('#pw').val()
  }
 socket.emit('request','login;' + JSON.stringify(user));
}

function logout(){
  socket.emit('request','logout;');
}

function getRunningAuctions(){
  socket.emit('request','getAuctions;');
}

function hideForLogOut(){
  $('#login').show();
  $('#register').show();
  $('#form_user').show();
  $('#form_pw').show();
  $('#logout').hide();
  $('#articleList').empty();
}

function bid(that){
  console.log('bid!');

  var newBid = {
    product: $(that).data('id');
    value: $('#value_' + auctionId).val();
  }
  socket.emit('request','bid;' + JSON.stringify(newBid));

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
  var minutes = diff.getUTCMinutes();

  return(days  +"d - "+ ('0' + houres).slice(-2) + ":"+ ('0' + minutes).slice(-2) + ":" + ('0' + seconds).slice(-2));
}

function updateTime(auctionId){
  var remainingTime = getRemaing($('#time_' + auctionId).data('end'));
  $('#time_' + auctionId).empty();
  $('#time_' + auctionId).append(remainingTime);

}
function changeOutputText(msg,mode){
  $('#output').empty();
  $('#output').append(msg);
  $('#output').removeClass('alert-danger');
  $('#output').removeClass('alert-warning');
  $('#output').removeClass('alert-success');
  $('#output').addClass('alert-' + mode);
}

