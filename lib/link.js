'use strict';

var urlExpander			= require('./expand');

function Link( ){}


/* "urls" : [ {
      "indices" : [ 112, 134 ],
      "url" : "http:\/\/t.co\/yOdg9TiZwc",
      "expanded_url" : "http:\/\/bit.ly\/15HDa4c",
      "display_url" : "bit.ly\/15HDa4c"
    } ]*/


Link.prototype = {

	// parses any usernames/sgn from mentions array
	parse: function ( tweet, callback ){
		if( tweet && tweet.entities && tweet.entities.urls && tweet.entities.urls.length > 0 ){
			var i = tweet.entities.urls.length;
			while (i--) {

				// if bit.ly expand

				// **** EXPAND ALL LINKS ****
				if(tweet.entities.urls[i].expanded_url.indexOf('http://bit.ly/') > -1){
					urlExpander(tweet.entities.urls[i].expanded_url, function(err, data){
						if(data && data.url){
							callback(err, data.url, 'link')
						}else{
							callback(err, data, 'link')
						}
					});
				}else{
					if(callback){
						callback(null, tweet.entities.urls[i].expanded_url, 'link');
					}
				}


				// **** ADD SGN MAPPER ****

				
			}
		}
	}

};


exports.Link = Link;