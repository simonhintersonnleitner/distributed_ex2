/* 
  @Authors:
  Simon Hintersonnleitner
  Fabin Hoffmann
*/
var socket = io.connect('http://localhost', {path: "/public/socket.io"});
var loggedIn = false;
var username = '';

$(document).ready(function (){

  $('#logout').hide();
  $('#header').hide();


  $('#login').click(function(){
    login();
  });

  $('#pw').keydown(function(e) {
    if (e.keyCode == 13) {
      login();
    }
  });

  $('#register').click(function(){
    username = $('#user').val();
    register();
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
    var split_result = res.split(';');

    if(split_result[0]){
      if(split_result[0] == 'login'){
        if(split_result[2] == 'ok'){
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
      }else if(split_result[0] == 'auctions'){
        printAuctions(JSON.parse(split_result[2]));
      }else if(split_result[0] == 'register'){
        if(split_result[2] == 'ok'){
          login();
          changeOutputText("Registration success",'success');
        }else{
          changeOutputText("Registration failed!",'danger');
        }
      }else if(split_result[0] == 'endAuction'){
        var auctionId = split_result[2];
        console.log("auction_ended id:" + auctionId);
        $('#time_' + auctionId).remove();
        $('#bidform_' + auctionId).remove();
        $('#check_' + auctionId).remove();
        $('#row_' + auctionId).find('td').eq(3).empty();
        $('#row_' + auctionId).find('td').eq(3).append("Time is over!");
      }else if(split_result[0] == 'winAuction'){
        if(loggedIn)
          $('#row_' + split_result[2]).find('td').eq(4).append("You have won this auction!");
      }else if(split_result[0] == 'newAuction'){
        addNewAuction(JSON.parse(split_result[2]));
      }else if(split_result[0] == 'newBid'){
        $('#output').empty();
        if(split_result[2] == -1) {
          changeOutputText("Congratulation you have the lowest single-bid!",'success');
        }
        else if(split_result[2] == 1) {
          changeOutputText("You have an single-bid but its to high",'warning');
        }
        else if(split_result[2] == -2) {
          changeOutputText("The auction ist timed out or the bid is invalid",'danger');
        }
        else {
          changeOutputText(split_result[2] + " other people have the same bid as you!",'warning');
        }
      }else if(split_result[0] == 'checkBid'){
        $('#output').empty();
        if(split_result[2] == -1) {
          changeOutputText("You have not set an bid!",'danger');
        }
        else if(split_result[2] == 1) {
          changeOutputText("Congratulation you have actually the lowest single-bid!",'success');
        }
        else {
          changeOutputText("Sorry you dont have the lowest single-bid at this moment!",'warning');
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
    var check = {
      auctionId: $(this).data('id')
    }
    socket.emit('request','checkBid;'+username+';' + JSON.stringify(check));
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
  username = $('#user').val();
  var user = {
    user: $('#user').val(),
    pw: $('#pw').val()
  }
  socket.emit('request','login;'+username+';' + JSON.stringify(user));
}

function logout(){
  socket.emit('request','logout;'+username+';');
  hideForLogOut();
  loggedIn = false;
  changeOutputText("Logout successfull!","warning");
}

function getRunningAuctions(){
  socket.emit('request','getAuctions;'+username+';');
}

function register(){
  username = $('#user').val();
  var user = {
    user: $('#user').val(),
    pw: $('#pw').val()
  }
  socket.emit('request','register;'+username+';'+ JSON.stringify(user));
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
  var auctionId = $(that).data('id');
  var newBid = {
    auctionId: auctionId,
    value: $('#value_' + auctionId).val()
  }
  socket.emit('request','newBid;'+username+';'+ JSON.stringify(newBid));
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
  console.log(msg);
  $('#output').empty();
  $('#output').append(msg);
  $('#output').removeClass('alert-danger');
  $('#output').removeClass('alert-warning');
  $('#output').removeClass('alert-success');
  $('#output').addClass('alert-' + mode);
}

