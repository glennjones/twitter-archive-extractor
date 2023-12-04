'use strict';

var request         = require('request'),
	utils			= require('./utils'),
	shared			= require('./shared');


function Timeline( ){
	this.que = [];
	this.active = false;
}


// Creates a serial request list in memory
// A simple way not to flood twitter with page requests


Timeline.prototype = {


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

		console.log(options.twitterUsername)
		var url = 'http://tools.transmat.io/twitter/' + options.twitterUsername + '/timeline'

		request({uri: url}, function(requestErrors, response, body){
			if(!requestErrors && response.statusCode === 200){

				var status = JSON.parse(body);

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
			
			this.parse( {'username': this.que[0].username, 'twitterUsername': this.que[0].twitterUsername}, function( err, data ){

				if(!err && data && context.que[0]){
					// return job request properties with data
					var req = {
						'twitterUsername': context.que[0].twitterUsername,
						'username': context.que[0].username
					}
					context.que[0].callback( err, data, req );
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


exports.Timeline = Timeline;
