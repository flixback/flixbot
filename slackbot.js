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
	var feedbackGiverName="";
	var skills="";
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
				//console.log(err);
				//console.log(response.user.name);
				/*bot.reply(message,'Hello ' + response.user.name + '!!');
				bot.reply(message,'Who would like to request feedback from?');
				bot.reply(message,'Please use the @name format.');*/
				
				bot.startConversation(message,function(err,convo) {

					convo.ask('Who would like to request feedback from?',function(response,convo) {
					//convo.say('you typed in '+response.text);
					feedbackGiver = cleanID(response.text);
					
					convo.next();
					getNamebyID(feedbackGiver,function(cb){convo.say( "Now, I'm going to ask you a few questions to give some context to "+ cb ); feedbackGiverName = cb;});
		

						convo.ask("What are the skills you are interested in getting feedback on ?",function(response,convo) {
						//convo.say('Skills: ' + response.text);
						skills = response.text;
						convo.next();
							  
							convo.ask("Any particular context where/when you demonstrated these skills recently?",function(response,convo) {
							//convo.say('Context: ' + response.text);
							convo.next();
								
								convo.say( "Awesome! I'm now going to ask *"+ feedbackGiverName + "* for some feedback about *"+ skills+"*");
								
								convo.ask('Do you want me to go ahead? :smile:',[
								  {
									pattern: bot.utterances.yes,
									callback: function(response,convo) {
									  convo.say(':white_check_mark:');
									  // do something else...
									  convo.next();

									}
								  },
								  {
									pattern: bot.utterances.no,
									callback: function(response,convo) {
									  convo.say(':negative_squared_cross_mark: Perhaps later.');
									  // do something else...
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
	
	
	function getNamebyID(id, cb) {

		
		bot.api.users.info({"user":id},function(err,response) {
			if (err) {
				console.log(err);
				cb(err);
				//throw new Error(err); <@U02MGMJNX>
			}
			else{
			console.log("Name by ID " + response.user.profile.first_name);

			cb( response.user.profile.first_name);

			}
		});
		

	}
	
	function cleanID(id) {
		var newString = id.substr(2); //remove two first char
		var newString2 = newString.substr(0, newString.length-1); //remove last char 
		console.log("Clean ID = " + newString2);
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
