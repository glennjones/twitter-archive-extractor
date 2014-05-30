'use strict';



function Person( ){}


/* "user_mentions" : [ {
      "name" : "Madgex",
      "screen_name" : "madgex",
      "indices" : [ 3, 10 ],
      "id_str" : "14078781",
      "id" : 14078781
    } ],*/


Person.prototype = {

	// parses any usernames/sgn from mentions array
	parse: function( tweet, parsedPeople, callback  ){

		if( tweet && tweet.entities && tweet.entities.user_mentions && tweet.entities.user_mentions.length > 0 ){
			var mentions = tweet.entities.user_mentions,
				i = mentions.length;

			while (i--) {
				if(callback){
					var username = mentions[i].screen_name.toLowerCase();

					if( parsedPeople.indexOf(username) === -1){

						// creates a h-entry with child h-card this contains the profile of the person
						var	user = 	{
										'items': [{
											'type': ['h-entry','h-as-person'],
											'properties': {
												'name': [mentions[i].name],
												'published': [new Date().toISOString()],
												'x-source': ['twitter-archieve'],
												'x-publishing-intent': ['implicit']
											},
											'children': [{
												'type': ['h-card'],
												'properties': {
													'name': [mentions[i].name],
													'nickname': [username],
													'url': ['https://twitter.com/' + username],
													'x-account': [{
														'type': ['h-x-account'],
														'properties': {
															'domain': ['twitter.com'],
															'sgn': [
																'sgn://twitter.com/?ident='  + username,
																'sgn://twitter.com/?pk='  + mentions[i].id_str
															]
														},
													}]
												}
											}]
										}],
										'rels': {},
										'instructions': {
											'setAccessTo': 'private'
										}
									};
							


						callback(null, user, 'person');
						callback(null, 'sgn://twitter.com/?ident='  + username, 'sgn');
						callback(null, 'sgn://twitter.com/?pk='  + mentions[i].id_str, 'sgn');
					}
					parsedPeople.push(username);
				}
			}

		}
	}

};


exports.Person = Person;