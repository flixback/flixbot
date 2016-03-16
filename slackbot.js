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
							convo.say('Now, I\'m going to ask you a few questions to give some context to the person who\'s giving you feedback (aka your *"coach"*).\n _Hint: This will ensure 1) that you receive feedback on something you *care improving* and 2) that you can *immediatly act on*._');  

								convo.ask("*What are the areas you are interested in getting feedback on?* _Hint: It could be soft skills, technical skills, deliverables, work habits,.. Be really specific if you are interested in a particular aspect within this area._ ",function(response,convo) {
									skills = response.text;
								convo.next();
									
									convo.ask("Any particular context, event, or deliverable you'd like to point out to your coach?\n_Hint: The more recent the context is, the better and more accurate the feedback will be._",function(response,convo) {
										context = response.text;
									convo.next();		
										convo.say( "Awesome! Let's quickly review that I got everything right.\nI'm now going to ask *"+ feedbackGiverName + "* for some feedback about *"+ skills+"* in the context of *" + context +"*.");
										convo.next();	

										convo.ask('Do you want me to go ahead? :smile:',[
										  
										  {
											  pattern: bot.utterances.yes,
												callback: function(response,convo) {
												  controller.storage.teams.save({requester:feedbackRequester, giver:feedbackGiver, skills:skills}, function(err){});
												  
												  convo.say(':white_check_mark:');
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
