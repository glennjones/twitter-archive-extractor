'use strict';

var utils	= require('./utils'),
	shared	= require('./shared');


function Profile( ){}


Profile.prototype = {

	// parses twitter profile data into h-card format
	parse: function( profile, callback  ){
		// need to make sure all vars are reset here
		this.profile = profile;
		this.out = {
			'items': [{
					'type': ['h-card'],
					'properties': {}
				}],
			'rels': {}
		};

		var prop = this.out.items[0].properties;

		this.addProperty('expanded_url','url');
		this.addProperty('screen_name','nickname');
		this.addProperty('full_name','name');
		this.addProperty('location','label');
		this.addProperty('bio','note');

		if( this.profile.id && this.profile.id !== '' ){
			prop.uid = ['twitter-profile:' + this.profile.id];
		}

		this.out.items[0].properties['account'] = [{
			'type': ['h-account'],
			'properties': {
				'domain': ['twitter.com'],
				'username': [this.profile.screen_name],
				'userid': [this.profile.id],
				'verified': true,
				'public': true
			}
		}];

		if(callback){
			callback(null, this.out);
		}

	},

	addProperty: function(profileName, hCardName){
		var prop = this.out.items[0].properties;

		if( this.profile[profileName] && this.profile[profileName] !== '' ){
			prop[hCardName] = [this.profile[profileName]];
		}
	}


};


exports.Profile = Profile;
