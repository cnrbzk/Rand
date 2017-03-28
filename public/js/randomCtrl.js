app.controller("randomCtrl", function ($scope, socket) {
    init();
    $('#mainDiv').show();

    socket.on('updateUserList', function(data){
        console.log('update');
        $scope.groupAdmin = data.admin;
        $scope.userList = data.userList;
    });

    socket.on('randProcess', function (randList) {
        randCounter = 0;
        randConnIdList = randList;
        $scope.hasRandProcess = true;
        startRandLoop();
    });

    $scope.leaveGroup = function () {
        $('#ajaxLoaderDiv').show();
        socket.disconnect();
        init();
        $('#ajaxLoaderDiv').hide();
    };

    $scope.clearNickname = function () {
        socket.disconnect();
        deleteCookie('randomNickname');
        init();
    };

    $scope.joinGroupClicked = function () {
        $('#ajaxLoaderDiv').show();
        $("#hubStatusSpan").text('Connecting..');
        socket.connect(function(){
            $("#hubStatusSpan").text('Joining Group..');
            socket.emit('joinGroup', {groupname : $scope.groupName.trim(), password : $scope.password}, function (result) {
                if (result.isJoined) {
                    joinedGroup(result.user);
                }
                else {
                    $scope.errorMsg = result.errorMsg;
                    socket.disconnect();
                }
                $('#ajaxLoaderDiv').hide();
            });
        });
    };

    $scope.setNickname = function () {
        if ($scope.user.nickname != null && $scope.user.nickname.length > 0) {
            deleteCookie('randomNickname');
            createCookie('randomNickname', $scope.user.nickname.trim(), 1000);
            $scope.hasNickname = true;
            $scope.showIndex = true;
        }
    };

    $scope.startRandom = function () {
        $scope.hasRandProcess = true;
        socket.emit('startRandom');
    };

    function startRandLoop() {
        setTimeout(function () {
            $scope.randConnId = randConnIdList[randCounter];
            console.log(randCounter);
            console.log(randConnIdList[randCounter]);
            $scope.$apply();
            if (++randCounter < randConnIdList.length) {
                startRandLoop();
            }
            else {
                $scope.hasRandProcess = false;
                if ($scope.user.connectionId == $scope.groupAdmin.connectionId) {
                    socket.emit('unlockGroup');
                }
                $scope.$apply();
            }
        }, 300);
    }

    function checkNickname() {
        var nickname = readCookie('randomNickname');
        if (nickname != null && nickname.length > 0) {
            $scope.user.nickname = nickname;
            return true;
        }
        return false;
    }

    function init() {
        $scope.user = {};
        $scope.groupAdmin = {};
        $scope.userList = {};
        $scope.hasNickname = false;
        $scope.showIndex = false;
        $scope.hasGroup = false;
        $scope.hasRandProcess = false;
        $scope.randConnId = '';
        $scope.errorMsg = '';
        $scope.groupName = '';
        var randCounter = 0;
        var randConnIdList = [];
        if (checkNickname()) {
            $scope.hasNickname = true;
            $scope.showIndex = true;
        }
    }

    function joinedGroup(user) {
        $scope.user = user;
        $scope.showIndex = false;
        $scope.hasGroup = true;
        $scope.errorMsg = '';
    }
});