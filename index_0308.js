﻿const firebase = require("firebase");

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const request = require('request');

const email = "test123@test.com";
const password = "test123";

const PAGE_ACCESS_TOKEN = "abc1337";

var login = require("facebook-chat-api");

var config = {  
   apiKey: "AIzaSyDqtbrB1CnPl6DGvRIVlrY2Af2sB3A8-aI",
   authDomain: "test1-8add6.firebaseapp.com",
   databaseURL: "https://test1-8add6.firebaseio.com/",
   storageBucket: "test1-8add6.appspot.com",
   
}; 
//admin.initializeApp(functions.config().firebase);
firebase.initializeApp(config);

/*firebase.auth().createUserWithEmailAndPassword(email, password)
    .catch(function(error) {
  // Handle Errors here.
  var errorCode = error.code;
  var errorMessage = error.message;
  if (errorCode == 'auth/weak-password') {
    console.log('The password is too weak.');
  } else {
    console.log(errorMessage);
  }
  console.log(error);
}); */	

firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
   console.log(error.code);
   console.log(error.message);	
});

exports.get = functions.https.onRequest((req, res) => {
	console.log("Message");
    if (req.query['hub.verify_token'] === 'abc1337') {
		res.send(req.query['hub.challenge']);
    } else {

		var data = req.body;

	    // Make sure this is a page subscription
	    if (data.object === 'page') {

			// Iterate over each entry - there may be multiple if batched
			data.entry.forEach(function(entry) {
				var pageID = entry.id;
				var timeOfEvent = entry.time;
					
					// Iterate over each messaging event
					entry.messaging.forEach(function(event) {
						if (event.message) {
							receivedMessage(event);
						}  if (event.postback) {
							processPostback(event);
						} else {
							console.log("Webhook received unknown event: ", event);
						}
					});
			});
			res.sendStatus(200);
	    }	
	}

function processPostback(event) {
	var senderId = event.sender.id;
	var payload = event.postback.payload;
	console.log("SENDERID + PAYLOAD", senderId, payload);
	console.log("event procsessPostback ", event);
	
}
	  
function receivedMessage(event) {	
	var timeMsg = event.timestamp;
	var fromMsg = new Boolean(true);
	var message = event.message;
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
	timeMsg = 0 - timeMsg;
	//var payload = event.postback.payload;
	
	//console.log("payload: ", payload);
	
	var messageText = message.text;
	
	//messageDate = new Date(timeMsg);
	
	var idMsg = message.mid;
	var textMsg = message.text;
	var urlMsg = message.attachments;
	
	if (urlMsg) textMsg = urlMsg;
	
	
    var rootRef = firebase.database().ref();
	var ref = firebase.database().ref();
	
	
	var i = "a";
	
	console.log("received: ", JSON.stringify(message)); 
	
	var new_sender;
	var s = "\"";
	new_sender = senderID.concat(s);
	new_sender = s.concat(new_sender);
	
	//var flag = 0;
	var childs = 0;
	
	var count = 0;
	
	chatix();
	
	function chatix() {
	
	var ref = firebase.database().ref('fbChats/');
	ref.once("value")
	.then(function(snapshot) {
	childs = snapshot.numChildren();
	//console.log("Childs %d", childs);
	
	//Если нет чатов, то создание нового чата
    if (snapshot.numChildren() == 0) {
		var chatStoreRef = ref.push();
		
		chatStoreRef.set({
			"peer": senderID,	
			"page": recipientID,
			"archival": false,
			"lastMessage": textMsg,
			"updatedTime": timeMsg
		});
		
	//Если есть хотя бы 1 чат	
	} else { 
		rootRef.child("fbChats/").on("child_added", function(snapshot) {
			
			//Если чат уже есть (проверка в цикле)
			if (snapshot.child("peer").val() == senderID) { 
				//console.log("EQUAL");
				count = count - 1000;
			} else { 
				//console.log(new_sender, snapshot.child("peer").val());
				//console.log("NOT EQUAL");
				count = count + 1;
			}
			//console.log("Childs %d Count %d", childs, count);
			if (count == childs) {
			//flag = flag + 1;
			//Если чата нет (то есть senderID был уникальным), то пушим новый FBChat 
			var echatStoreRef = ref.push();
				echatStoreRef.set({
					"peer": senderID,	
					"page": recipientID,
					"archival": false,
					"lastMessage": textMsg,
					"updatedTime": timeMsg
			}); childs = childs + 100; return; 
			} else { ; }//console.log("Childs %d Count %d", childs, count); }		
	});
	

	}
	});
	
	} 

	
	rootRef.child("fbChats/").on("child_added", function(snapshot) {
		var flag = 0;
		var chatKey = snapshot.child("peer").val();
		
		//console.log("Chat key: ", chatKey);
		
		//Проход по всем ключам FBChat
		if (chatKey == senderID) { 
			chatKey = snapshot.key; 
			flag = flag + 1; 
			
			function listenForNotificationRequests() {
				//var requests = rootRef.child('notificationRequests');
				//rootRef.on('child_added', function(requestSnapshot) {
				//var request = requestSnapshot.val();
				sendNotificationToUser(
				  senderID, 
				  textMsg,
				  function() {
					  return;
					//rootRef().child('notificationRequests').remove();
				  }
				); return;	
			  //}, function(error) {
				//console.error(error);
			  //});
			};

			function sendNotificationToUser(username, message, onSuccess) {
			  request({
				url: 'https://fcm.googleapis.com/fcm/send',
				method: 'POST',
				headers: {
				  'Content-Type' :' application/json',
				  'Authorization': 'key=AAAAYDNvJ74:APA91bHYS7XYJVcWlUvkqufqDFEz4SOk4vfo6ujG525DSbeB1RrJZ-xUXh4UDJyP3RLZDRjlo8NIyXFQ4rR-dEZaGAqRCt4sjYq7oOavy1nBJlk_1sTZyzTDVorEATIG2IEzKv_mP6SI'
				},
				body: JSON.stringify({
				   data: {
					title: "Новое сообщение от " + senderID,
					body: textMsg,
					chat: chatKey,
					chatType: "facebook"
				   },

				  to : '/topics/-KopmehrDMc2vc_4Pnt2'
				})
			  }, function(error, response, body) {
				if (error) { console.error(error); }
				else if (response.statusCode >= 400) { 
				  console.error('HTTP Error: '+response.statusCode+' - '+response.statusMessage); 
				}
				else {
				  onSuccess();
				}
			  });
			}
			//Отправление уведомления (функция выше)
			listenForNotificationRequests();
		}
			
		//Пуш сообщения в базу данных после нахождения ключа
		if (flag == 1) {
			var storesRef = rootRef.child('fbMessages/');
			var pushKey = storesRef.push().getKey();
			
			
			console.log("push key:", pushKey);
			
			var fromUser = true;
			
			//Взятие id через pageId (старое)
			//var facebookPageIdOld = snapshot.child("pageId").val();
			
			//Новое взятие id (key через organizations)
			rootRef.child("organizations/").on("child_added", function(snapshot) {
				var facebookPageKey = snapshot.child('facebookPage').val();
				console.log("facebookPageKey: ", facebookPageKey);
				
				rootRef.child("facebookPages").on("child_added", function(snapshot) {
					if (snapshot.key == facebookPageKey) {
						var facebookPageId = snapshot.child("pageId").val();
						console.log("facebookPageId", facebookPageId);
						if (senderID == facebookPageId) fromUser = false;
						return;
					}
				});
			});
			
			var newStoreRef = rootRef.child('fbMessages/' + pushKey).set({
				"messageId": idMsg,
				"createdAt": timeMsg,
				"fromUser": fromMsg,
				"message": textMsg,
				"chat": chatKey,
				"fromUser": fromUser
			});
			//Обновление lastMessage
			var uchatRef = rootRef.child('fbChats/' + snapshot.key);
			var uchatPush = uchatRef.child('lastMessage').set(textMsg); //lastMessage (from fbMessages/)
			//Добавление нового ключа в fbChats/CHAT_KEY/messages/MESSAGE_KEY
			var messageStoreRef = rootRef.child('fbChats/' + snapshot.key + '/' + 'messages/' + pushKey).set(true);
			//Обновление времени
			var newUpdatedTime = rootRef.child('fbChats/' + snapshot.key + '/' + 'updatedTime').set(timeMsg); 
			//Обновление archival
			var newArchival = rootRef.child('fbChats/' + snapshot.key + '/' + 'archival').set(false); 
			/*
			//Обновление всех ключей в цикле, а не только текущего
			var pathtoChats = snapshot.key;
			rootRef.child("fbMessages/").on("child_added", function(snapshot) {
				var messagetoPush = snapshot.key;
				if (snapshot.child("chat").val() == pathtoChats) {
					var messageStoreRef = rootRef.child('fbChats/' + pathtoChats + '/' + 'messages/' + snapshot.key).set(true);
				}
			}); */
			
			//message from User ? Page
			/*var fromUser = true;
			rootRef.child("fbChats/").on("child_added", function(snapshot) {
				var facebookPageId = snapshot.child("pageId").val();
				if (senderID == facebookPageId) { fromUser = false; }
				var facebookPagePush = rootRef.child('fbMessages/' + snapshot.key).child('fromUser').set(fromUser);
			});
			console.log("fromUser: ", fromUser); */
			
			
			flag = flag + 1;
		}
	});
	
	//var arrFbChatsMsg = rootRef.child('fbChats/').set(textMsg);
	/*
	login({
	  email: "my_mail@yandex.ru",
	  password: "123456"
	  }, function callback(err, api) {
	  if (err) return console.error(err);

	  var userId = "12345";
	  var msg = {
		body: "Hey! That's Node.js!"
	  };
	  api.sendMessage(msg, userID);
	});
	*/	
	
	
	
	
	/*
	
	//Send Push (нерабочая система уведомлений)
	SendPush = function (userId, push) {

    var regIds = Meteor.users.findOne({_id:userId},{fields:{registrationIds : 1 }}).registrationIds;

    if (! regIds || regIds.length == 0)
        return;

    var headers = {
        'Content-Type': 'application/json',
        'Authorization': 'key=AIzaSyDqtbrB1CnPl6DGvRIVlrY2Af2sB3A8-aI'
    };

        var data = {
            'registration_ids': regIds,
            'notification': {
                'body': push.message,
                'title': push.title,
                'sound': 'default'
            },
            'data': push
        };

        HTTP.call('POST', 'https://fcm.googleapis.com/fcm/send', {headers: headers, data: data}, function (err, res) {
            if (err)
                console.log(err);
        });
	}
	*/
	
	
	
	//Отправка сообщения через Firebase в чат публичной страницы на Facebook
	/*
	function callSendAPI(messageData) {
		request({
		uri: 'https://graph.facebook.com/v2.6/me/messages',
		qs: { access_token: "abc1337" },
		method: 'POST',
		json: messageData

	    }, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				  var recipientId = body.recipient_id;
				  var messageId = body.message_id;

				  console.log("Successfully sent generic message with id %s to recipient %s", 
					messageId, recipientId);
			} else {
				  console.error("Unable to send message.");
				  console.error(response);
				  console.error(error);
			}
		});  
	}
	
	function sendTextMessage(recipientId, messageText) {
	var messageData = {
		recipient: {
		  id: recipientId
		},
		message: {
		  text: messageText
		}
	};

	callSendAPI(messageData);
	}	
	
	sendTextMessage(senderID, "Postback called");
	*/
	
}
});

