'use strict';


var utils			= require('./utils'),
	shared			= require('./shared'),
	foursquare		= require('./foursquare');


function Checkin( ){}


Checkin.prototype = {

	// parses tweet into h-entry checkin
	parse: function( tweet, callback  ){
		var context = this;
		this.out = shared.parseCommon('h-as-checkin', tweet);

		// add code to append geo and foursquare syndication
		var fourSquareUrl = '';
		if( tweet && tweet.entities && tweet.entities.urls ){
			var i = tweet.entities.urls.length;
			while (i--) {
				if(tweet.entities.urls[i].expanded_url.indexOf('4sq.com')){
					fourSquareUrl = tweet.entities.urls[i].expanded_url;
				}
			}
		}

		if(fourSquareUrl !== ''){
			foursquare.getFourSquareData( fourSquareUrl, function(err, data){
				if(!err){

					var geo = {
							'type': ['h-geo'],
							'properties': {
								'latitude': [data.items[0].properties.latitude],
								'longitude': [data.items[0].properties.longitude]
							}
						};

					var adr = {
							'type': ['h-adr'],
							'properties': data.items[0].properties
						};
					delete adr.properties.latitude;
					delete adr.properties.longitude;
					
					// the location information in three different types 
					// string, h-geo and h-address
					context.out.items[0].properties.name = data.items[0].properties.name;
					context.out.items[0].properties.location = [data.items[0].properties.name[0], geo, adr];
					context.out.items[0].properties.syndication.push(data.url);

					callback(null, context.out, 'checkin');
				}else{
					callback(err, null, 'checkin');
				}
			});
		}else{
			callback(null, this.out, 'checkin');
		}

	}

};

exports.Checkin = Checkin;

