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
		
		bot.startConversation(message,function(err,convo) {
			feedbackRequester = convo.source_message.user;
			console.log("REQUESTER = "+convo.source_message.user);
			convo.ask('Who would like you to request feedback from?',function(response,convo) {

			feedbackGiver = cleanID(response.text);
			console.log("GIVER = "+feedbackGiver);
					feedbackGiverName = response.text;
					convo.say( 'Now, I\'m going to ask you a few questions to give some context to '+ feedbackGiverName+ ' (aka your *"coach"*).\n _Hint: This will ensure 1) that you receive feedback on something you *care improving* and 2) that you can *immediatly act on*._' ); 
					
					convo.ask("*What are the areas you are interested in getting feedback on?* \n _Hint: It could be soft skills, technical skills, deliverables, work habits,.. Be really specific if you are interested in a particular aspect within this area._ ",function(response,convo) {
						skills = response.text;
							  
							convo.ask("Any particular context, event, or deliverable you'd like to point out to your coach?\n_Hint: The more recent the context is, the better and more accurate the feedback will be._",function(response,convo) {
							context = response.text;
							
								convo.say( "Awesome! Let's quickly review that I got everything right.\nI'm now going to ask *"+ feedbackGiverName + "* for some feedback about *"+ skills+"* in the context of *" + context +"*.");
								
								convo.ask('Do you want me to go ahead? :smile:',[
								  {
									pattern: bot.utterances.yes,
									callback: function(response,convo) {
									  convo.say('http://i.giphy.com/6mtnL2jh5HWHm.gif');
									  goAskFeedback(bot,feedbackGiver,feedbackRequester);
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
	
	function goAskFeedback(bot,idGiver,idRequester){
		
		var idIM;
		//var idRequester = "U02MGMJNX"; //GREG
		//var idRequester = feedbackRequester; 
		var nameRequester = "<@"+idRequester+">";
		//var idGiver = "U02HMNGRZ";//ANTO
		//var idGiver = feedbackGiver;
		var nameGiver = "<@"+idGiver+">";
		var fskills = skills;
		var fcontext = context;
		
		//GET THE IM CHANNEL FROM SLACK API
		bot.api.im.open({"user":idGiver},function(err,response) {
			 if (err) throw new Error(err);
			idIM = response.channel.id;
			console.log("idIM = "+idIM);
			
				bot.say({"channel":idIM, "text":"Hello *"+nameGiver+"*:bangbang:"});
				bot.startConversation({"channel":idIM,"user":idGiver},function(err,convo) {	
					
					
					convo.say( "*"+nameRequester+"* would like to get your feedback and insights about *"+fskills+"* in the context of *"+fcontext+"*."); 
					convo.say("I know that feedback is not always easy to communicate. To help you to articulate it properly, I'll assist you with a serie of 4 quick questions. Based on your answers, I'll take care of writing the final feedback response. Let's get started!");
					//convo.next();
						convo.ask("1/4 - First, think of something you thought was *extremely good* or that "+nameRequester+" *did extremely well*. The goal is to pinpoint something that "+nameRequester+" should keep doing in the future. What was it? \n _Hint:Try to be as specific as you can. Remember, it's a feedback about *"+fskills+"* in the context of *"+fcontext+"._",function(response,convo) {
							
							convo.ask("2/4 - Let's move to *opportunities to excel*. Try to recall something you thought was good but could be easily enhanced. What would that be? \n _Hint: This is the most important piece of your feedback. People who stands out build on their strength._",function(response,convo) {
									
								
								convo.ask("*3/4* - What specific actions would you recommend "+nameRequester+" to take? Share them with me too!\n _Hint: Examples or detailed recommendations works great to make recommendations actionable._",function(response,convo) {
									
									
									convo.ask("*4/4* - Awesome!. Finally, let's touch on *weaknesses*. Anything that "+nameRequester+" might really consider *fixing in priority*? Let me know. \n _Hint:Ideas, tricks or examples are usually great way to suggest how to fix this!_",function(response,convo) {
										
										
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
								console.log("SAVE IN MONGO DB");
								var values = convo.extractResponses();
								goDeliverFeedback(bot,values, fcontext,idRequester,idGiver);
								//goDeliverFeedback(bot,values,"fishing","U02HMNGRZ","U02MGMJNX");

							}
						}

					  });
					
				});
			
			
		});

	}
	
	function goDeliverFeedback(bot,feedback,context,req,giv){
		console.log("delivering feedback");
		var idRequester = req; 
		
		bot.api.im.open({"user":idRequester},function(err,response) {
			 if (err) throw new Error(err);
			idIM = response.channel.id;
			console.log("idIM = "+idIM);
			bot.startConversation({"channel":idIM,"user":idRequester},function(err,convo) {	
				convo.say( "Hello *<@"+req+">*! It looks like you have a new feedback from *<@"+giv+">* about *"+context+"*! This is what he wrote:");
				convo.say( ":clap: This was really good and can stay as it is in the future : "+feedback.q1);
				convo.say( ":slightly_smiling_face: This good but stills need to change : "+feedback.q2);
				convo.say( ":worried: This is something that need to be improved : "+feedback.q3);
				convo.say( ":bulb: This is a suggestion on how to improve : "+feedback.q4);
			});
		});
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
