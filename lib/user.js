'use strict';



function User( ){}


/* "user_mentions" : [ {
      "name" : "Madgex",
      "screen_name" : "madgex",
      "indices" : [ 3, 10 ],
      "id_str" : "14078781",
      "id" : 14078781
    } ],*/


User.prototype = {

	// parses any usernames/sgn from mentions array
	parse: function( tweet, callback  ){

		if( tweet && tweet.entities && tweet.entities.user_mentions && tweet.entities.user_mentions.length > 0 ){
			var mentions = tweet.entities.user_mentions,
				i = mentions.length;

			while (i--) {
				if(callback){
					var username = mentions[i].screen_name.toLowerCase();
					callback(null, username, 'user');
					callback(null, 'sgn://twitter.com/?ident='  + username, 'sgn');
				}
			}

		}
	}

};


exports.User = User;