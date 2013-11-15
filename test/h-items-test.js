'use strict';

var assert		= require('chai').assert,
	tweet		= require('./tweet.json'),
	hItems		= require('../lib/h-items');


// units tests h-items.js 

describe("h-items test", function() {

	

	var hitems = new hItems.hItems();
	hitems.parse( tweet );

debugger;

	it("parse", function() {

		
/*		assert.equal( 
			hitems.out.items[0].properties.syndication[0],
			'https://twitter.com/glennjones/status/382484003887906816',
			'should contain a link to status on twitter'
		);*/

		assert.equal( 
			hitems.out.items[0].properties.uid[0],
			'twitter-status:382484003887906816',
			'should contain a uid that namspaces twitter status'
		);

		assert.equal( 
			hitems.out.items[0].properties.published[0],
			'2013-09-24T12:37:47+0000',
			'should contain a published date in compact form'
		);


		assert.equal( 
			hitems.out.items[0].properties.category[0],
			'indieweb',
			'should contain list of hashtags converted into tags'
		);


		assert.equal( 
			hitems.out.items[0].properties.location[0].properties.latitude,
			'50.82430939',
			'should contain list h-geo with latitude,'
		);


	});




	it("parseText", function() {

		hitems.text = 'test the @glennjones username';
		hitems.parseText();
		assert.equal( 
			hitems.html,
			'test the <a class="auto-link h-x-username" href="https://twitter.com/glennjones">@glennjones</a> username',
			'should warp the username in a hyperlink'
		);

		hitems.text = 'test the #css hashtag';
		hitems.parseText();
		assert.equal( 
			hitems.html,
			'test the <a class="auto-link hashtag" href="https://twitter.com/search?q=%23css&amp;src=hash">#css</a> hashtag',
			'should warp the hashtag in a hyperlink'
		);

		hitems.text = 'test the http://t.co/j75A0eVYhR url expanding';
		hitems.parseText();
		assert.equal( 
			hitems.html,
			'test the <a class="auto-link" data-shorten="http://t.co/j75A0eVYhR" href="http://iawriter.com">http://iawriter.com</a> url expanding',
			'should expand and then warp the url in a hyperlink'
		);

		assert.equal( 
			hitems.text,
			'test the http://iawriter.com url expanding',
			'should expand url in the text'
		);


	});


	it("formatDate", function() {
		assert.equal( 
			hItems.formatDate('2007-03-31 00:00:00 +0000'), 
			'2007-03-31T00:00:00+0000', 
			'should turn a HTML5 ISO date in the more compact ISO form'
			);

	});


	it("expandURL", function() {

		assert.equal( 
			hitems.expandURL('http://t.co/j75A0eVYhR'), 
			'http://iawriter.com', 
			'should expand URL to full version'
			);	
				
		assert.equal( 
			hitems.expandURL('http://glennjones.net/'), 
			'http://glennjones.net/', 
			'should NOT expand URL not in the entities urls array'
			);

	});


});
