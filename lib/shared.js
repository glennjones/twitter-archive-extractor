
'use strict';

var utils	= require('./utils');

module.exports = {

	// parses common h-entry elements from the tweet format
	parseCommon: function( name, tweet ){

		var out = {
				'items': [{
						'type': ['h-entry',name],
						'properties': {}
					}],
				'rels': {},
				'instructions': {
					'setAccessTo': 'public'
				}
			},
			text = '',
			html = '',
			tags = [],
			prop = out.items[0].properties;


		// add content ie plain text and html
		if(tweet.text){
			// parse the text into data collections
			text = this.parseText( tweet.text, tweet );
			html = this.parseHTML( tweet.text, tweet );

			prop.content = [{
				value: text,
				html: html
			}];
		}

		// add date
		if(tweet.created_at){
			prop.published = [this.formatDate(tweet.created_at)];
		}

		// add converted hashtags as tags 
		tags = this.getTags( tweet.text, tweet );
		if(tags.length > -1){
			prop.category = tags;
		}

		// add syndication url and x-source
		if(tweet.id_str){
			prop.syndication = ['https://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str];
			prop['x-source'] = ['twitter-archieve'];
			prop['x-publishing-intent'] = ['explicit'];
		}

		// add geo data if its in the point format
		if(tweet.geo && tweet.geo.type && tweet.geo.type === 'Point'){
			prop.location = [{
				'type': ['h-geo'],
				'properties': {
					'latitude': tweet.geo.coordinates[0],
					'longitude': tweet.geo.coordinates[1]
				}
			}];
		}

		if(tweet.in_reply_to_status_id && tweet.in_reply_to_status_id !== ''){
			prop['in-reply-to'] = ['https://twitter.com/' + tweet.in_reply_to_screen_name + '/status/' + tweet.in_reply_to_status_id_str];
		}

		return out;

	},



	// parse the text and create a HTML string
	parseHTML: function ( text, tweet ){
		var words = text.split(' '),
			i = words.length;

		while (i--) {
			var word = utils.trim( words[i] );
			if(word.indexOf('http') === 0 || word.indexOf('https') === 0){
				var expanded = this.expandURL(word, tweet);
				words[i] = '<a class="auto-link" data-shorten="' + word + '" href="' + expanded + '">' + expanded + '</a>';
			}
			if(word.indexOf('@') === 0){
				words[i] = '<a class="auto-link h-x-username" href="https://twitter.com/' + word.replace('@','') + '">' + word + '</a>';
			}
			if(word.indexOf('#') === 0){
				//this.tags.push( word.replace(/#/g,'').toLowerCase() );
				words[i] = '<a class="auto-link hashtag" href="https://twitter.com/search?q=' + encodeURIComponent(word) + '&amp;src=hash">' + word + '</a>';
			}
		}
		return words.join(' ');
	},


	// parse the text replacing URLs with expanded versions
	parseText: function ( text, tweet ){
		var words = text.split(' '),
			i = words.length;

		while (i--) {
			var word = utils.trim( words[i] );
			if(word.indexOf('http') === 0 || word.indexOf('https') === 0){
				var expanded = this.expandURL(word, tweet);
				text = text.replace( word, expanded );
			}
		}
		return text;
	},


	// parse the text for tags
	getTags: function ( text, tweet ){
		var tags = [],
			words = text.split(' '),
			i = words.length;

		while (i--) {
			var word = utils.trim( words[i] );
			if(word.indexOf('#') === 0){
				tags.push( word.replace(/#/g,'').toLowerCase() );
			}
		}
		return tags;
	},


	// expands urls using tweet data
	expandURL: function ( url, tweet ){
		if(tweet && tweet.entities.urls.length > 0){
			var i = tweet.entities.urls.length,
				x = 0;
			while (x < i) {
				if(url === tweet.entities.urls[x].url){
					url = tweet.entities.urls[x].expanded_url;
					break;
				}
				x++;
			}
		}
		return url;
	},


	// turn a HTML5 ISO date in the more compact ISO form
	formatDate: function ( date ){
		var items = date.split(' ');
		return items[0] + 'T' + items[1] + items[2];
	}


};