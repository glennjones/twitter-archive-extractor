'use strict';

var utils	= require('./utils'),
	shared	= require('./shared');


function Note( ){}


Note.prototype = {

	parse: function( tweet, callback  ){
		this.out = shared.parseCommon('h-as-note', tweet);

		if(callback){
			callback(null, this.out, 'note');
		}
	}

};


exports.Note = Note;


