var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var cookieParser = require('socket.io-cookie');
socket = require('./socket.js');

app.use(express.static(__dirname + '/public'));
io.use(cookieParser);
socket.initializeSocket(io);

io.on('connection',socket.client);


var port = process.env.PORT || 1337;
http.listen(port, function(){
  console.log("Express server listening on port %d in %s mode",port, app.settings.env);
});
