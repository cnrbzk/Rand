'use strict';
app.factory('socket', function ($rootScope) {
  var socket = io({autoConnect : false});
  var connectionCallBack = null;
  socket.on('connect', function(){
    if(connectionCallBack != null){
      connectionCallBack();
  }
    connectionCallBack = null;
  });
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    },
    connect: function(callback){
      connectionCallBack = callback;
     socket.connect();
    },
    disconnect: function(){
      socket.disconnect();
    }
  };
});