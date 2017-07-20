const functions = require('firebase-functions'); //include functions (functions.https.onRequest)

function get(req, res) {
	
	//Special Facebook token, read developers.facebook.com/docs/graph-api/webhooks
    if (req.query['hub.verify_token'] === 'abc1337') {
		res.send(req.query['hub.challenge']);
    } else {
     	
		//ody of request
		var data = req.body;

	    //Make sure this is a page subscription
	    if (data.object === 'page') {

			//Iterate over each entry - there may be multiple if batched
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
}

function receivedMessage(event) {
	var timeOfMessage = event.timestamp;
	var message = event.message;
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
	
	console.log("createdAt: ", messageDate.toUTCString()); //Timestamp
	console.log("author: %d", senderID);
	console.log("received: %d", recipientID);
}