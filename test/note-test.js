'use strict';

var assert		= require('chai').assert,
	tweet		= require('./tweet.json'),
	Note		= require('../lib/note');


// units tests h-items.js 

describe("h-items test", function() {

	

	var note = new Note.Note();
	note.parse( tweet );


	it("parse", function() {

		assert.strictEqual( 
			note.out.items[0].properties.syndication[0],
			'https://twitter.com/glennjones/status/382484003887906816',
			'should contain a link to status on twitter'
		);
		
		assert.strictEqual( 
			note.out.items[0].properties.uid[0],
			'twitter-status:382484003887906816',
			'should contain a uid that namspaces twitter status'
		);

		assert.strictEqual( 
			note.out.items[0].properties.published[0],
			'2013-09-24T12:37:47+0000',
			'should contain a published date in compact form'
		);


		assert.strictEqual( 
			note.out.items[0].properties.category[0],
			'indieweb',
			'should contain list of hashtags converted into tags'
		);


		assert.strictEqual( 
			note.out.items[0].properties.location[0].properties.latitude,
			50.82430939,
			'should contain list h-geo with latitude,'
		);

		assert.strictEqual( 
			note.out.items[0].properties['in-reply-to'][0],
			'https://twitter.com/glennjones/status/382445268513206272',
			'should have the url of the status which the user is replying to'
		);


	});




	it("parseText", function() {

		note.text = 'test the @glennjones username';
		note.parseText();
		assert.strictEqual( 
			note.html,
			'test the <a class="auto-link h-x-username" href="https://twitter.com/glennjones">@glennjones</a> username',
			'should warp the username in a hyperlink'
		);

		note.text = 'test the #css hashtag';
		note.parseText();
		assert.strictEqual( 
			note.html,
			'test the <a class="auto-link hashtag" href="https://twitter.com/search?q=%23css&amp;src=hash">#css</a> hashtag',
			'should warp the hashtag in a hyperlink'
		);

		note.text = 'test the http://t.co/j75A0eVYhR url expanding';
		note.parseText();
		assert.strictEqual( 
			note.html,
			'test the <a class="auto-link" data-shorten="http://t.co/j75A0eVYhR" href="http://iawriter.com">http://iawriter.com</a> url expanding',
			'should expand and then warp the url in a hyperlink'
		);

		assert.strictEqual( 
			note.text,
			'test the http://iawriter.com url expanding',
			'should expand url in the text'
		);


	});


	it("formatDate", function() {
		assert.strictEqual( 
			Note.formatDate('2007-03-31 00:00:00 +0000'), 
			'2007-03-31T00:00:00+0000', 
			'should turn a HTML5 ISO date in the more compact ISO form'
			);

	});


	it("expandURL", function() {

		assert.strictEqual( 
			note.expandURL('http://t.co/j75A0eVYhR'), 
			'http://iawriter.com', 
			'should expand URL to full version'
			);	
				
		assert.strictEqual( 
			note.expandURL('http://glennjones.net/'), 
			'http://glennjones.net/', 
			'should NOT expand URL not in the entities urls array'
			);

	});


});
