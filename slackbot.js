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
		
		/*clientSync = Meteor.wrapAsync(client.create, client);
		pipeline = clientSync('MediaPipeline');	*/
		
		/*var botStartConversationSync = Meteor.wrapAsync(bot.startConversation,bot);
		var convo = botStartConversationSync(message);
		console.log("REQUESTER = "+convo.source_message.user);*/
			
		bot.startConversation(message,function(err,convo) {
			feedbackRequester = convo.source_message.user;
			console.log("REQUESTER = "+convo.source_message.user);
			convo.ask('Who would like you to request feedback from?',function(response,convo) {
			//convo.say('you typed in '+response.text);
			feedbackGiver = cleanID(response.text);
			console.log("GIVER = "+feedbackGiver);
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
							  convo.say('http://i.giphy.com/6mtnL2jh5HWHm.gif');
							  goAskFeedback(bot);
							  //Feedbacks.insert({requester:feedbackRequester, giver:feedbackGiver, skills:skills});
							  //Meteor code must always run within a Fiber. Try wrapping callbacks that you pass to non-Meteor libraries with Meteor.bindEnvironment. ???
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
						],{"key":"proceed","multiple":false});
					},{"key":"context","multiple":false});
				},{"key":"skills","multiple":false});
			},{"key":"fbgiver","multiple":false});
			
			convo.on('end',function(convo) {	//at the END of the convo, we take actions with the answers
			if (convo.status=='completed' ) {
				/*console.log(convo.extractResponse('fbgiver'));
				console.log(convo.extractResponse('skills'));
				console.log(convo.extractResponse('context'));
				console.log(convo.extractResponse('proceed'));*/
				if(convo.extractResponse('proceed') == "yes"){
					console.log("SAVE IN MONGO DB");
					/*Feedbacks.insert({
						requester:feedbackRequester, 
						giver:cleanID(convo.extractResponse('fbgiver')), 
						skills:convo.extractResponse('skills')
					});*/
				}
			}

		  });

		  });


				
			
	});
	
	function goAskFeedback(bot){
		
		var idIM;
		//var idRequester = "U02MGMJNX"; //GET FROM MONGODB GREG
		var idRequester = feedbackRequester; 
		var nameRequester;
		//var idGiver = "U02HMNGRZ";//GET FROM MONGODB ANTO
		var idGiver = feedbackGiver;
		var nameGiver;
		var fskills = skills;//GET FROM MONGODB
		
		//GET THE IM CHANNEL FROM SLACK API
		bot.api.im.open({"user":idGiver},function(err,response) {
			 if (err) throw new Error(err);
			idIM = response.channel.id;
			console.log("idIM = "+idIM);
			
			getNamebyID(idGiver,function(cb){nameGiver = cb; bot.say({"channel":idIM, "text":"Hello *"+nameGiver+"*:bangbang:"});
				bot.startConversation({"channel":idIM,"user":idGiver},function(err,convo) {	
					getNamebyID(idRequester,function(cb){
					convo.say( "*"+cb+"* would like to get your feedback about: *"+fskills+"*"); nameRequester = cb;
					convo.say("I'm now going to ask you a few questions in order to guide you to write your feedback. Let's get started!");
					convo.next();
						convo.ask("*1/4* - Can you give one advice to "+nameRequester+" on something that was good but stills need to change?",function(response,convo) {
							convo.next();
							convo.ask("*2/4* - How about a nice compliment now? You thought it was good and it cans stay as it is in the future",function(response,convo) {
								//do something with response
								convo.next();
								convo.ask("*3/4* - Great. Now, can you give "+nameRequester+" some criticism on somehting that need to be fixed ?",function(response,convo) {
									//do something with response
									convo.next();
									convo.ask("*4/4* - Last, can you give  a suggestion on how to improve?",function(response,convo) {
										//do something with response
										convo.next();
										convo.say("Awesome!I'm now going to send your feedback to "+nameRequester);
										convo.ask('Do you want me to go ahead? :smile:',[
										  {
											pattern: bot.utterances.yes,
											callback: function(response,convo) {
											  convo.say('done!');
											  //Feedbacks.insert({requester:feedbackRequester, giver:feedbackGiver, skills:skills});
											  //Meteor code must always run within a Fiber. Try wrapping callbacks that you pass to non-Meteor libraries with Meteor.bindEnvironment. ???
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
										],{"key":"proceed","multiple":false});
									},{"key":"q4","multiple":false});
								},{"key":"q3","multiple":false});
							},{"key":"q2","multiple":false});
						},{"key":"q1","multiple":false});
					});
					
					convo.on('end',function(convo) {	//at the END of the convo, we take actions with the answers
						if (convo.status=='completed' ) {
							/*console.log(convo.extractResponse('q1'));
							console.log(convo.extractResponse('q2'));
							console.log(convo.extractResponse('q3'));
							console.log(convo.extractResponse('q4'));
							console.log(convo.extractResponse('proceed'));*/
							if(convo.extractResponse('proceed') == "yes"){
								console.log("SAVE IN MONGO DB");
								var values = convo.extractResponses();
								goDeliverFeedback(bot,values);
								/*Feedbacks.insert({
									requester:feedbackRequester, 
									giver:cleanID(convo.extractResponse('fbgiver')), 
									skills:convo.extractResponse('skills')
								});*/
							}
						}

					  });
					
				});
			});
			
		});

	}
	
	function goDeliverFeedback(bot,feedback){
		console.log("delivering feedback");
		var idGiver = feedbackGiver;
		
		bot.api.im.open({"user":idGiver},function(err,response) {
			 if (err) throw new Error(err);
			idIM = response.channel.id;
			console.log("idIM = "+idIM);
			bot.startConversation({"channel":idIM,"user":idGiver},function(err,convo) {	
				convo.say( "Looks like you have a new feedback!");
				convo.say( feedback.q1);
			});
		});
	}
	
	controller.hears('test','direct_message,direct_mention,mention',function(bot,message) {
		goAskFeedback(bot);
	});
	controller.hears('send','direct_message,direct_mention,mention',function(bot,message) {
		goDeliverFeedback(bot);
	});
	
	
	function getNamebyID(id, cb) {

		
		bot.api.users.info({"user":id},function(err,response) {
			if (err) {
				console.log(err);
				cb(err);
				//throw new Error(err); <@U02MGMJNX>
			}
			else{
			//console.log("Name by ID " + response.user.profile.first_name);

			cb( response.user.profile.first_name);

			}
		});
		

	}
	
	function cleanID(id) {
		//console.log("ID = " + id);
		var newString = id.substr(2); //remove two first char
		//console.log("Clean ID = " + newString.substring(0,9));
		return newString.substring(0,9);
	}

}
