'use strict';

var request         = require('request'),
	utils			= require('./utils'),
	shared			= require('./shared');


function ExtendedNote( ){
	this.que = [];
	this.active = false;
}


// Creates a serial request list in memory
// A simple way not to flood twitter with page requests


ExtendedNote.prototype = {


	// add into list - each call is excuted in serial
	add: function( item, callback ){
		item.callback = callback;
		this.que.push(item)

		// start loop
		if(this.active === false){
			this.getNext();
		}
	},


	// parses tweet
	parse: function( options, callback  ){
		var context = this,
			delay = ( utils.isInt(options.delay) )? options.delay : 1000;

		console.log(options.url)

		request({uri: options.url}, function(requestErrors, response, body){
			if(!requestErrors && response.statusCode === 200){

				var status = JSON.parse(body);
				status.items[0].properties['x-source'] = ['twitter-archieve-extended'];
				status.items[0].properties['x-publishing-intent'] = ['explicit'];

				console.log('delay', delay)
				if(delay === 0){
					callback(null, status);
				}else{
					// create closure
					var func = function(callback, status) {
				      return function(){
				          callback(null, status)
				      };
				    };
				    setTimeout(func( callback, status ), delay);
				}
				
			}else{
				console.log(requestErrors)
				if(delay === 0){
					callback('http request error', null);
				}else{
					setTimeout(callback('http request error', null), delay)
				}
			}
		});
	},


	// loop while there are items in the list
	getNext: function(){
		var context = this;

		console.log( 'getNext was called' )

		if(this.que.length > 0){

			this.active = true;
			// closure to lock queue‎Item values
			
			this.parse( {'url': this.que[0].url}, function( err, data ){

				if(!err && data && data.items && context.que[0].tweet){
					var tweet = context.que[0].tweet;

					// if we are dealing with raw twitter json from archieve file
					if(tweet && tweet.id_str){
						var tweetUrl = 'https://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str;	
						data.items[0].properties.syndication = [tweetUrl];
					}
					context.que[0].callback( err, data, context.que[0].tweet );
				}else{
					context.que[0].callback( err, data, null );
				}
				
				context.que.shift();
				context.getNext();
			});


		}else{
			this.active = false;
		}
	},



};


exports.ExtendedNote = ExtendedNote;
