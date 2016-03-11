Feedbacks = new Mongo.Collection('feedbacks');
token = Meteor.settings.token;
if (Meteor.isClient) {
  
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
	//console.log("token="+ Meteor.settings.token);
	var feedbackGiver ="";
	var feedbackRequester ="";
	var feedbackGiverName="";
	var skills="";
	var context="";
	var Botkit = Meteor.npmRequire( 'botkit' );
	var controller = Botkit.slackbot({
	  debug: false
	});
	var bot = controller.spawn({
	  token: token
	})
	bot.startRTM(function(err,bot,payload) {
	  if (err) {
		throw new Error('Could not connect to Slack');
	  }
	});
	
	controller.hears('hello','direct_message,direct_mention,mention',function(bot,message) {
				
			bot.api.users.info({"user":message.user},function(err,response) {
				feedbackRequester = response.user.id;
				console.log("REQUESTER = "+feedbackRequester);
					
				bot.startConversation(message,function(err,convo) {

					convo.ask('Who would like to request feedback from?',function(response,convo) {
						feedbackGiver = cleanID(response.text); //We create and pass a CleanID
					convo.next();

						//We use a trick to wrap variable into a callback function in order to use its value
						getNamebyCleanID(feedbackGiver,function(cb){
							convo.say("Now, I'm going to ask you a few questions to give some context to "+ cb +".This will ensure that you receive feedback on something you care to improve. It will also help to recive feedback you can practically act on."); 
							feedbackGiverName = cb;});  // we call the function feedbackGiverName in the callback function passed as a 2nd argument in getNameCleanID function in order to force the eventloop to wait for the function to return the value of variable cb, so we can use it into the convo.say function.
							convo.next();

								convo.ask("What are the skills you are interested in getting feedback on ?",function(response,convo) {
									skills = response.text;
								convo.next();
									
									convo.ask("Any particular context when you demonstrated these skills? The more recent the better.",function(response,convo) {
										context = response.text;
									convo.next();		
										convo.say( "Awesome! Let's quickly review that I got everything right.I'm now going to ask *"+ feedbackGiverName + "* for some feedback about *"+ skills+"* in the context of *" + context +"*.");
										convo.next();	

										convo.ask('Do you want me to go ahead? :smile:',[
										  
										  {
											  pattern: bot.utterances.yes,
												callback: function(response,convo) {
												  convo.say(':white_check_mark:');
												  //Feedbacks.insert({requester:feedbackRequester, giver:feedbackGiver, skills:skills});
												  //Error received: Meteor code must always run within a Fiber. Try wrapping callbacks that you pass to non-Meteor libraries with Meteor.bindEnvironment. ???
												  convo.next();
												}
											  },	
										  
										  {
												pattern: bot.utterances.no,
												callback: function(response,convo) {
												  convo.say(':negative_squared_cross_mark: Perhaps later.');
												  convo.next();

												}
										  },
										  
										  {
											default: true,
												callback: function(response,convo) {
												  // just repeat the question
												  convo.repeat();
												  convo.next();
												}
										  }

										]);
										
									});

								});

							});
						
						  })


					  });
						
					
			});
	
	controller.hears({feedbackGiver},'direct_message,direct_mention,mention',function(bot,message) {
				
			bot.api.users.info({"user":message.user},function(err,response) {
				//console.log(err);
				//console.log(response.user.name);
				//getVerifiedUserID(response.user.name);
				bot.reply(message,'Got it! Can you give me some context about the feedback you want from ' + response.user.name + '?');
				bot.reply(message,':smile:');

			  });
				
			
	});
	
	//This function extrcat the name base don the CleanID
	function getNamebyCleanID(id, cb) {
		bot.api.users.info({"user":id},function(err,response) {
			if (err) {
				console.log(err);
				cb(err);
				//throw new Error(err); <@U02MGMJNX>
			}
			else{
			console.log("Name by ID " + response.user.profile.first_name);
			cb(response.user.profile.first_name);

			}
		});
		

	}
	
	function cleanID(id) {
		var newString = id.substr(2); //remove two first char
		console.log("LENGHT = " + newString.length);
		if(newString.length > 9){
			var newString2 = newString.substr(0, newString.length-2); //remove last char if there is ":" at the end because of Slack autocompletion
			console.log("Clean ID = " + newString2);
		}
		else{
			var newString2 = newString.substr(0, newString.length-1); //remove last char 
			console.log("Clean ID = " + newString2);
		}
		return newString2;
	}
	
	function getVerifiedUserID(username) {
		console.log("getVerifiedUserID of "+username);
		var ID;
		
		bot.api.users.list({},function(err,response) {
			
			//console.log(Object.keys(response.members).length);
			//console.log(response.members[0].name);
			//var results = [];
			var searchField = "name";
			for (var i=0 ; i < Object.keys(response.members).length ; i++)
			{
				console.log(response.members[i].name +"=="+ username);
				if (response.members[i].name == username) {
					//results.push(response.members[i].name);
					console.log(response.members[i].name);
					return response.members[i].id;
				}
			}
			
		});	
		
	}

}
