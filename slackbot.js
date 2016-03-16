Feedbacks = new Mongo.Collection('feedbacks');
token = Meteor.settings.token;
if (Meteor.isClient) {
  
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
	
	var feedbacks = {};
	//feedbacks["antoningregorydate"] = {'requester': 'antonin', 'giver': 'gregory', 'context': 'fishing'};
	
	/*if ("antoningregorydate" in feedbacks) {
	   console.log(feedbacks["antoningregorydate"].context); //del a["key1"] or del a.key1
	}*/
	
	
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


		bot.startConversation(message,function(err,convo) {
			var feedbackRequester = convo.source_message.user;
			console.log("REQUESTER = "+convo.source_message.user);
			convo.ask('Who would like you to request feedback from?',function(response,convo) {

			var feedbackGiver = cleanID(response.text);
			
			console.log("GIVER = "+feedbackGiver);
					var feedbackGiverName = response.text;
					convo.say( 'Now, I\'m going to ask you a few questions to give some context to '+ feedbackGiverName+ ' (aka your *"coach"*).\n _Hint: This will ensure 1) that you receive feedback on something you *care improving* and 2) that you can *immediatly act on*._' ); 
					
					convo.ask("*What are the areas you are interested in getting feedback on?* \n _Hint: It could be soft skills, technical skills, deliverables, work habits,.. Be really specific if you are interested in a particular aspect within this area._ ",function(response,convo) {
						var skills = response.text;
							  
							convo.ask("Any particular context, event, or deliverable you'd like to point out to your coach?\n_Hint: The more recent the context is, the better and more accurate the feedback will be._",function(response,convo) {
							var context = response.text;
							
								convo.say( "Awesome! Let's quickly review that I got everything right.\nI'm now going to ask *"+ feedbackGiverName + "* for some feedback about *"+ skills+"* in the context of *" + context +"*.");
								
								convo.ask('Do you want me to go ahead? :smile:',[
								  {
									pattern: bot.utterances.yes,
									callback: function(response,convo) {
									  convo.say('http://i.giphy.com/6mtnL2jh5HWHm.gif');
									  feedbacks[feedbackRequester+feedbackGiver] = {'requester': feedbackRequester, 'giver': feedbackGiver, 'skills': skills, 'context': context};
									  //console.log(feedbacks[feedbackRequester+feedbackGiver].context);
									  goAskFeedback(bot,feedbackRequester+feedbackGiver);
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
							convo.next();});
					convo.next();});
			convo.next();});
			
			/*convo.on('end',function(convo) {	//at the END of the convo, we take actions with the answers
			if (convo.status=='completed' ) {
				console.log(convo.extractResponse('fbgiver'));
				console.log(convo.extractResponse('skills'));
				console.log(convo.extractResponse('context'));
				console.log(convo.extractResponse('proceed'));
				if(proceed == true){
					console.log("SAVE IN MONGO DB");
					Feedbacks.insert({
						requester:feedbackRequester, 
						giver:cleanID(convo.extractResponse('fbgiver')), 
						skills:convo.extractResponse('skills')
					});
				}
			}

		  });*/

		  });


				
			
	});
	
	function goAskFeedback(bot,feedbackKey){
		
		var idIM;
		//var idRequester = "U02MGMJNX"; //GREG
		var idRequester = feedbacks[feedbackKey].requester; 
		var nameRequester = "<@"+idRequester+">";
		var idGiver = "U02HMNGRZ";//ANTO
		//var idGiver = feedbacks[feedbackKey].giver; 
		var nameGiver = "<@"+idGiver+">";
		var fskills = feedbacks[feedbackKey].skills;
		var fcontext = feedbacks[feedbackKey].context;
		
		//GET THE IM CHANNEL FROM SLACK API
		bot.api.im.open({"user":idGiver},function(err,response) {
			 if (err) throw new Error(err);
			idIM = response.channel.id;
			console.log("idIM = "+idIM);
			
				bot.say({"channel":idIM, "text":"Hello *"+nameGiver+"*:bangbang:"});
				bot.startConversation({"channel":idIM,"user":idGiver},function(err,convo) {	
					
					
					convo.say( "*"+nameRequester+"* would like to get your feedback about *"+fskills+"* in the context of *"+fcontext+"*."); 
					convo.say("I'm now going to ask you a few questions in order to guide you to write your feedback. Let's get started!");
					//convo.next();
						convo.ask("*1/4* - Can you give one *compliment* to "+nameRequester+" on something you thought was really good and can stay as it is in the future",function(response,convo) {
							
							convo.ask("*2/4* - How about an *advice* now? You thought that was good but stills need to change",function(response,convo) {
								
								
								convo.ask("*3/4* - Great. Now, can you give "+nameRequester+" some criticism on something that *need to be fixed* ?",function(response,convo) {
									
									
									convo.ask("*4/4* - Last, can you give a suggestion on *how to improve*?",function(response,convo) {
										
										
										convo.say("Awesome!I'm now going to send your feedback to "+nameRequester);
										convo.ask('Do you want me to go ahead? :smile:',[
										  {
											pattern: bot.utterances.yes,
											callback: function(response,convo) {
											  convo.say('done!');
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
										],{"key":"proceed","multiple":false});
									convo.next();},{"key":"q4","multiple":false});
								convo.next();},{"key":"q3","multiple":false});
							convo.next();},{"key":"q2","multiple":false});
						convo.next();},{"key":"q1","multiple":false});
					
					
					convo.on('end',function(convo) {	//at the END of the convo, we take actions with the answers
						if (convo.status=='completed' ) {
							/*console.log(convo.extractResponse('q1'));
							console.log(convo.extractResponse('q2'));
							console.log(convo.extractResponse('q3'));
							console.log(convo.extractResponse('q4'));
							console.log(convo.extractResponse('proceed'));*/
							if(convo.extractResponse('proceed') == "yes" || convo.extractResponse('proceed') == "yup" ||convo.extractResponse('proceed') == "y" ||convo.extractResponse('proceed') == "yeah" ||convo.extractResponse('proceed') == "ok" ||convo.extractResponse('proceed') == "sure" ){
								
								var values = convo.extractResponses();
								feedbacks[feedbackKey] = {'requester': idRequester, 'giver': idGiver, 'skills': fskills, 'context': fcontext, 'values':values};
								goDeliverFeedback(bot,feedbackKey);

							}
						}

					  });
					
				});
			
			
		});

	}
	
	function goDeliverFeedback(bot,feedbackKey){
		console.log("delivering feedback");
		//var idRequester = feedbacks[feedbackKey].requester; 
		var idRequester = "U02HMNGRZ";
		bot.api.im.open({"user":idRequester},function(err,response) {
			 if (err) throw new Error(err);
			idIM = response.channel.id;
			console.log("idIM = "+idIM);
			bot.startConversation({"channel":idIM,"user":idRequester},function(err,convo) {	
				convo.say( "Hello *<@"+idRequester+">*! It looks like you have a new feedback from *<@"+feedbacks[feedbackKey].giver+">* about *"+feedbacks[feedbackKey].context+"*! This is what he wrote:");
				convo.say( ":clap: This was really good and can stay as it is in the future : "+feedbacks[feedbackKey].values.q1);
				convo.say( ":slightly_smiling_face: This good but stills need to change : "+feedbacks[feedbackKey].values.q2);
				convo.say( ":worried: This is something that need to be improved : "+feedbacks[feedbackKey].values.q3);
				convo.say( ":bulb: This is a suggestion on how to improve : "+feedbacks[feedbackKey].values.q4);
			});
		});
		delete feedbacks[feedbackKey];
	}
	
	controller.hears('test','direct_message,direct_mention,mention',function(bot,message) {
		goAskFeedback(bot);
	});
	controller.hears('send','direct_message,direct_mention,mention',function(bot,message) {
		goDeliverFeedback(bot,feedback,"fishing","U02HMNGRZ","U02MGMJNX");
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
