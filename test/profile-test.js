'use strict';

var assert		= require('chai').assert,
	mochaDate	= require('./profile.json'),
	Profile		= require('../lib/profile');


// units tests h-card.js 

describe("h-items test", function() {

	

	var profile = new Profile.Profile();
	profile.parse( mochaDate );


	it("parse", function() {

		assert.strictEqual( 
			profile.out.items[0].properties.name[0],
			'Glenn Jones',
			'should contain the full name'
		);
		
		assert.strictEqual( 
			profile.out.items[0].properties.nickname[0],
			'glennjones',
			'should contain the username of the account'
		);

		assert.strictEqual( 
			profile.out.items[0].properties.url[0],
			'http://glennjones.net/',
			'should contain the url'
		);

		assert.strictEqual( 
			profile.out.items[0].properties.label[0],
			'Brighton, UK',
			'should contain the address label'
		);


		assert.strictEqual( 
			profile.out.items[0].properties.note[0],
			'Exploring semantic mark-up and data portability ideas. Founder of Madgex. Brighton geek',
			'should contain the bio'
		);

		assert.strictEqual( 
			profile.out.items[0].properties.uid[0],
			'twitter-profile:946491',
			'should have the uid'
		);


		assert.strictEqual( 
			profile.out.items[0].properties.uid[0],
			'twitter-profile:946491',
			'should have the uid'
		);


	});




});
