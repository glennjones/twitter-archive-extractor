'use strict';

var request         = require('request'),
	cheerio			= require('cheerio'),
	microformat		= require('microformat-node'),
	urlExpander     = require('./expand');

/*var place = {
	'name': 'The Fountain Head'
	'address': {
		'streetaddress': '101-103 North Rd',
		'locality': 'Brighton',
		'region': 'East Sussex',
		'postalcode': 'BN1 1YE',
	}
	'geo': {
		'latitude': 50.82546434591956
		'longitude': -0.13726405109133194
	}
	'uid': 'foursquare-place:4b05c7a5f964a52015e322e3'
	'url': ['https://foursquare.com/v/the-fountain-head-brighton-east-sussex/4b05c7a5f964a52015e322e3']
}

var checkin = {
	shorthen: 'http://4sq.com/I4cZeM'
	url: 'https://foursquare.com/glennjones/checkin/528671e211d2300d6dc8a6e0?s=aMuPdDl2LiaM6aqRmnD98IAETRk&ref=tw'
	place: 'https://foursquare.com/v/the-fountain-head-brighton-east-sussex/4b05c7a5f964a52015e322e3'
	profile: 'https://foursquare.com/glennjones/'
	datetime: '2013-11-15T19:11:30.000Z'
}*/


function getFourSquareData( shortUrl, callback ){
	var context = this;

	// expand the short url 
	urlExpander(shortUrl, function(err, data) {
		if (!err && data.url) {
			// get checkin date
			context.getCheckinData( data.url, shortUrl, function(err, checkinObj){
				if (!err) {
					// get place data
					context.getPlaceData( checkinObj.place, function(err, placeObj){
						if (!err) {
							placeObj.url = checkinObj.url;
							placeObj.uid = checkinObj.uid;
							callback(null, placeObj);
						}else{
							callback(err, null);
						}	
					});
				}else{
					callback(err, null);
				}	
			});
		} else {
			callback(err, null);
		}
	});
}


// gets the data from a foursquare checkin page
function getCheckinData( url, shortUrl, callback ){
	var context = this;

	if(url && url.indexOf('https://foursquare.com/') > -1 && url.indexOf('/checkin/') > -1){
		request({uri: url}, function(requestErrors, response, body){
			if(!requestErrors && response.statusCode === 200){
				var checkinObj = context.buildCheckinObject( body, {
					shorthen: shortUrl,
					url: url
				});
				callback(null, checkinObj);
			}else{
				callback('http request error', null);
			}
		});
	}else{
		callback('wrong url format for a foursquare checkin: ' + url, null);
	}
}


// builds a checkin object from a foursquare checkin page data
function buildCheckinObject( html, checkin ){
	var items = [],
		$ = cheerio.load(html);

	if(checkin.url)	{
		items = checkin.url.split('/');
		checkin.username = items[3];
	}
	checkin.datetime = $('meta[property="playfoursquare:date"]').attr('content');
	checkin.place = $('meta[property="playfoursquare:place"]').attr('content');
	checkin.uid = 'foursquare-checkin:' + items[items.length-1].split('?')[0];
	return checkin;
}


// gets the data from a foursquare place page
function getPlaceData( url, callback ){
	var context = this;

	if(url && url.indexOf('https://foursquare.com/v/') > -1){
		request({uri: url}, function(requestErrors, response, body){
			if(!requestErrors && response.statusCode === 200){
				context.buildPlaceObject( body, url, function(err, placeObj){
					callback(null, placeObj);
				});
			}else{
				callback('http request error', null);
			}
		});
	}else{
		callback('wrong url format for a foursquare place: ' + url, null);
	}
}


// builds a place object from a foursquare place page data
function buildPlaceObject( html, url, callback ){
	var place = {},
		items = [],
		$ = cheerio.load(html);

	place.url = [url];
	place.name = [$('meta[property="og:title"]').attr('content')];
	place.latitude = [$('meta[property="playfoursquare:location:latitude"]').attr('content')];
	place.longitude = [$('meta[property="playfoursquare:location:longitude"]').attr('content')];

	place['label'] = [$('div[itemprop="address"]').text()];
	place['street-address'] = [$('span[itemprop="streetAddress"]').text()];
	place['locality'] = [$('span[itemprop="addressLocality"]').text()];
	place['region'] = [$('span[itemprop="addressRegion"]').text()];
	place['postal-code'] = [$('span[itemprop="postalCode"]').text()];


	items = url.split('/');
	place.uid = 'foursquare-place:' + items[items.length-1];
	place.syndication = [url];

	callback(null, {'items': [{'type':['h-adr'], 'properties': place}]} );

	/*microformat.parseHtml(html, {}, function(err, ufData){
		if(ufData && ufData.items && ufData.items.length > 0){
			ufData.items[0].properties.syndication = [place.url];
			ufData.items[0].properties.uid = [place.url];
			place.address = ufData.items[0];
			callback(null, place);
		}else{
			callback('microformat parser errored or could not find data', null);
		}
	});*/
	
	
}


exports.getFourSquareData = getFourSquareData;
exports.getCheckinData = getCheckinData;
exports.getPlaceData = getPlaceData;
exports.buildCheckinObject = buildCheckinObject;
exports.buildPlaceObject = buildPlaceObject;
