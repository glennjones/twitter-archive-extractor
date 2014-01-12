'use strict';


var utils	= require('./utils'),
	shared	= require('./shared');


function Photo( ){}


Photo.prototype = {

	// parses tweet into h-entry photo
	parse: function( tweet, callback  ){
		this.out = shared.parseCommon('h-as-photo', tweet);

		if( tweet && tweet.entities && tweet.entities.media ){
			this.out.items[0].properties.photo = [];
			var i = tweet.entities.media.length;
			while (i--) {
				if(tweet.entities.media[i].media_url){
					var expanded = tweet.entities.media[i].media_url,
						shorten = tweet.entities.media[i].url;

					// adding :orig  to the end of the URL return the original uplaoded size
					this.out.items[0].properties.photo.push(expanded + ':orig');

					// exchange short image URL for expanded version
					this.out.items[0].properties.content[0].value.replace(shorten,expanded);
					this.out.items[0].properties.content[0].html.replace(shorten,expanded);

				}
			}
		}

		if(callback){
			callback(null, this.out, 'photo');
		}
	}

};


exports.Photo = Photo;


