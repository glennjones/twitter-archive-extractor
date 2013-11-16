'use strict';

var assert		= require('chai').assert,
	profile		= require('./profile.json'),
	hCard		= require('../lib/h-card');


// units tests h-card.js 

describe("h-items test", function() {

	

	var hcard = new hCard.hCard();
	hcard.parse( profile );


	it("parse", function() {

		assert.strictEqual( 
			hcard.out.items[0].properties.name[0],
			'Glenn Jones',
			'should contain the full name'
		);
		
		assert.strictEqual( 
			hcard.out.items[0].properties.nickname[0],
			'glennjones',
			'should contain the username of the account'
		);

		assert.strictEqual( 
			hcard.out.items[0].properties.url[0],
			'http://glennjones.net/',
			'should contain the url'
		);

		assert.strictEqual( 
			hcard.out.items[0].properties.label[0],
			'Brighton, UK',
			'should contain the address label'
		);


		assert.strictEqual( 
			hcard.out.items[0].properties.note[0],
			'Exploring semantic mark-up and data portability ideas. Founder of Madgex. Brighton geek',
			'should contain the bio'
		);

		assert.strictEqual( 
			hcard.out.items[0].properties.uid[0],
			'twitter-profile:946491',
			'should have the uid'
		);


		assert.strictEqual( 
			hcard.out.items[0].properties.uid[0],
			'twitter-profile:946491',
			'should have the uid'
		);


	});




});
