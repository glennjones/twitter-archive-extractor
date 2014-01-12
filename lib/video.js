'use strict';


var utils	= require('./utils'),
	shared	= require('./shared');


function Video( ){}


Video.prototype = {

	// parses tweet into h-entry video
	parse: function( tweet, callback  ){
		this.out = shared.parseCommon('h-as-video', tweet);

		// add code to append image html and photo property
		// consider file upload option

		if(callback){
			callback(null, this.out, 'video');
		}
	}

};


