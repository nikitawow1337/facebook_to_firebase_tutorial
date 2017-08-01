const firebase = require("firebase");

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
/*
firebase.auth().createUserWithEmailAndPassword(email, password)
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
						} else {
							console.log("Webhook received unknown event: ", event);
						}
					});
			});
			res.sendStatus(200);
	    }	
	}
	  
	  
function receivedMessage(event) {	
	var timeMsg = event.timestamp;
	var fromMsg = new Boolean(true);
	var message = event.message;
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
	
	var messageText = message.text;
	
	//messageDate = new Date(timeMsg);
	
	var idMsg = message.mid;
	var textMsg = message.text;
	var urlMsg = message.attachments;
	
	if (urlMsg) textMsg = urlMsg;
	
	
    var rootRef = firebase.database().ref();
	
	var i = "a";
	
	console.log("received: ", JSON.stringify(message));
	//console.log("got: ", JSON.stringify(urlMsg)); 
	
	var new_sender;
	var s = "\"";
	new_sender = senderID.concat(s);
	new_sender = s.concat(new_sender);
	
	//var flag = 0;
	var childs = 0;
	
	var count = 0;
	
	chatix();
	
	function chatix() {
	
	var ref = firebase.database().ref('FBChat');
	ref.once("value")
	.then(function(snapshot) {
	childs = snapshot.numChildren();
	console.log("Childs %d", childs);
	
	//Если нет чатов, то создание нового
    if (snapshot.numChildren() == 0) {
		var chatStoreRef = ref.push();
		chatStoreRef.set({
			"peer": senderID,	
			"page": recipientID,
			"archival": "false"
		});
		
	//Если есть хотя бы 1 чат	
	} else { 
		rootRef.child("FBChat/").on("child_added", function(snapshot) {
			console.log("Peer ", snapshot.child("peer").val(), "new sender", new_sender);
			
			//Если чат уже есть (проверка в цикле)
			if (snapshot.child("peer").val() == senderID) { 
				console.log("EQUAL");
				count = count - 1;
			} else { 
				//console.log(new_sender, snapshot.child("peer").val());
				console.log("NOT EQUAL");
				count = count + 1;
			}
			console.log("Childs: %d Count: %d", childs, count);
			if (count == childs) {

			//Если чата нет (то есть senderID был уникальным), то пушим новый FBChat 
			var echatStoreRef = ref.push();
				echatStoreRef.set({
					"peer": senderID,	
					"page": recipientID,
					"archival": "false"
			}); return; 
			} else { ; }		
	});
	

	}
	});
	
	} 

	//Создание FBMessage с ключом "peer" FBChat
	rootRef.child("FBChat/").on("child_added", function(snapshot) {
		var flag = 0;
		var chatKey = snapshot.child("peer").val();
		console.log("Chat key: ", chatKey);
		
		//Проход по всем ключам FBChat
		if (chatKey == senderID) { 
			chatKey = snapshot.key; 
			flag = flag + 1; 
		}
			
		//Пуш сообщения в базу данных после нахождения ключа
		if (flag == 1) {
			var storesRef = rootRef.child('FBMessage');
			var newStoreRef = storesRef.push();
			newStoreRef.set({
				"id": idMsg,
				"createdAt": timeMsg,
				"fromUser": fromMsg,
				"message": textMsg,
				"chat": chatKey
			});
			flag = flag + 1;
		}
	});
	
	
	/*
	//Пример отправки сообщения на Facebook (не работает с Firebase)
	login({
	  email: "example123@yandex.ru",
	  password: "example123456"
	  }, function callback(err, api) {
	  if (err) return console.error(err);

	  var userId = "12345";
	  var msg = {
		body: "Hey! That's Node.js!"
	  };
	  api.sendMessage(msg, userID);
	});
	*/
	
	//Отправка сообщения через Firebase в чат публичной страницы на Facebook (не работает с Firebase)
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

