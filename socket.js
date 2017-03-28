var crypto = require('crypto');
var io = {};

var initializeSocket = function(socket){
	io = socket;
}

var client = function(client){
console.log('nickname is %s id is %s',client.request.headers.cookie.randomNickname, client.id);
var user = {nickname : client.request.headers.cookie.randomNickname, connectionId : client.id};

client.on('joinGroup',function(data, func){
	var groupValue = createMd5Hash(data);
	console.log(data.groupname +' '+data.password+' '+groupValue);
	if(!groupList.contains(groupValue)){
		createGroup(data, func, groupValue);
	}
	else{
		joinGroup(data, func, groupValue);
	}
});

client.on('startRandom', function(){
	console.log(user.groupValue);
	if(groupList.contains(user.groupValue) && groupList.get(user.groupValue).groupAdmin.connectionId == user.connectionId){
		var group = groupList.get(user.groupValue);
		group.isLocked = true;
		var randCount = group.userList.count() * 10;
		var randUserList = [];
		for (var i = 0; i < randCount; i++) {
			console.log('userList array : '+group.userList.toArray());
			console.log('userList count : '+group.userList.count());
			console.log('random : '+ getRandomInt(0, group.userList.count() - 1));
			var u = group.userList.toArray()[getRandomInt(0, group.userList.count() - 1)];
			randUserList.push(u.connectionId);
		}
		io.to(user.groupValue).emit('randProcess', randUserList);
	}
});

client.on('unlockGroup', function(){
	if(groupList.contains(user.groupValue) && groupList.get(user.groupValue).groupAdmin.connectionId == user.connectionId){
		var group = groupList.get(user.groupValue);
		group.isLocked = false;
	}
});

client.on('disconnect', leaveGroup);

function leaveGroup(){
	if(user.groupValue && groupList.contains(user.groupValue)){
		console.log('user leaving : '+user.groupValue);
		var group = groupList.get(user.groupValue);
		group.userList.free(user);
		client.leave(user.groupValue);
		if(group.groupAdmin.connectionId == user.connectionId && group.userList.count() > 0){
			group.groupAdmin = group.userList.toArray()[0];
		}
		if(group.userList.count() == 0){
			groupList.free(group);
		}
		else{
			io.to(group.groupValue).emit('updateUserList', {userList : group.userList.toArray(), admin : group.groupAdmin});
		}
	}
}

function joinGroup(data, func, groupValue){
	var group = groupList.get(groupValue);
	if(!group.password || group.password.trim().length == 0 || group.password == data.password){
		if(group.isLocked){
			func({ isJoined : false, errorMsg : "Group is locked." });
			return;
		}
		user.group = data.groupname;
		user.groupValue = groupValue;
		group.userList.add(user);
		client.join(group.groupValue);
		func({isJoined : true, user : user});
		io.to(group.groupValue).emit('updateUserList', {userList : group.userList.toArray(), admin : group.groupAdmin});
	}
	else{
		func({ isJoined : false, errorMsg : "Wrong group or password." });
		return;
	}
}

function createGroup(data, func, groupValue){
	user.group = data.groupname;
	user.groupValue = groupValue;
	var group = initGroup(data.groupname, data.password, groupValue, user);
	group.userList.add(user);
	groupList.add(group);
	client.join(group.groupValue);
	io.to(group.groupValue).emit('updateUserList', {userList : group.userList.toArray(), admin : group.groupAdmin});
	func({isJoined : true, user : user});
}

};

function createMd5Hash(value){
	var key = value.groupname.toLowerCase();
	if(value.password && value.password.length > 0){
		key+=value.password;
	}
	var md5 = crypto.createHash('md5');
	md5.update(key);
	return md5.digest('hex');
}

function initGroup(name, password, value, admin){
	var group = {};
	group.groupAdmin = admin;
	group.groupname = name;
	group.password = password;
	group.groupValue = value;
	group.isLocked = false;
	group.userList = (function(){
		var users = {};

		 var add  = function(user){
		 	if(user && !users[user.connectionId]){
		 		users[user.connectionId] = user;
		 	}
		 };

		 var get = function(connectionId){
		 	if(connectionId && users[connectionId]){
		 		return users[connectionId];
		 	};
		 };

		 var contains = function(connectionId){
		 	return (connectionId && users[connectionId]);
		 };

		 var free = function(user){
		 	if(contains(user.connectionId)){
		 		delete users[user.connectionId];
		 	};
		 };

		 var toArray = function(){
		 	var userArray = [];
		 	for(user in users){
		 		userArray.push(users[user]);
		 	}
		 	return userArray;
		 };

		 var count = function(){
		 	return toArray().length;
		 };

		 return {add : add, get : get, free : free, contains : contains, toArray : toArray, count : count}; 
	}());

	return group;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var groupList = (function(){
	var groups = {};
	var add = function(group){
		if(group && !groups[group.groupValue]){
			groups[group.groupValue] = group;
		}
	};

	var get = function(groupValue){
		if(groupValue && groups[groupValue]){
			return groups[groupValue];
		}
	};

	var contains = function(groupValue){
		return (groupValue && groups[groupValue]);
	};

	var free = function(group){
		if(group && groups[group.groupValue]){
			delete groups[group.groupValue];
		}
	};

	return {add : add, get : get, free : free, contains : contains};
}());

module.exports = {client : client, initializeSocket : initializeSocket};