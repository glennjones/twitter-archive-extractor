'use strict';


var utils	= require('./utils'),
	shared	= require('./shared');


function Photo( ){}


Photo.prototype = {


	parse: function( tweet, callback  ){
		this.out = shared.parseCommon('h-as-photo', tweet);

		// add code to append image html and photo property
		// consider file upload option

		if(callback){
			callback(null, this.out, 'photo');
		}
	}

};


