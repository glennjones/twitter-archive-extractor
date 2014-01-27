'use strict';

var fs				= require('fs-extra'),
	path			= require('path'),
	util			= require('util'),
	events			= require('events'),
	util			= require('util'),
	DecompressZip	= require('decompress-zip'),
	expand			= require('./expand'),
	Note			= require('./note').Note,
	Checkin			= require('./checkin').Checkin,
	Photo			= require('./photo').Photo,
	Video			= require('./video').Video,
	Link			= require('./link').Link,
	Person			= require('./person').Person,
	Profile			= require('./profile').Profile,
	ExtendedNote	= require('./extended-note').ExtendedNote;

// set globally to share queue
var extendedNote = new ExtendedNote();


function Extractor( options ) {
	events.EventEmitter.call(this);
	this.extractionPath = (options && options.extractionPath)? options.extractionPath : path.join(__dirname, '../zipextraction/');
	this.useExtendedParsing = (options && options.useExtendedParsing)? options.useExtendedParsing : false;
}

util.inherits(Extractor, events.EventEmitter);

Extractor.prototype.extract = function( options ){
	var context = this;

	this.useExtendedParsing = (options && options.useExtendedParsing)? options.useExtendedParsing : false;
	this.startDate = (options.startDate)? options.startDate : new Date(2006,3,21);

	this.stats = {
		'files': 0,
		'items': 0,
		'notes': 0,
		'people': 0,
		'photos': 0,
		'videos': 0,
		'checkins': 0,
		'tags': 0,
		'links': 0,	
		'sgns': 0,	
		'errors': 0
	};

	this.urls = [];

	// use objects own events to update stats
	this.on('file', function(){ context.stats.files ++;});
	this.on('item', function(){ context.stats.items ++;});
	this.on('note', function(){ context.stats.notes ++;});
	this.on('person', function(){ context.stats.people ++;});
	this.on('photo', function(){ context.stats.photos ++;});
	this.on('video', function(){ context.stats.videos ++;});
	this.on('checkin', function(){ context.stats.checkins ++;});
	this.on('tag', function(){ context.stats.tags ++;});	
	this.on('link', function(){ context.stats.links ++;});
	this.on('sgn', function(){ context.stats.sgns ++;});
	this.on('error', function(){ context.stats.errors ++;});

	this.on('done', function(){ 
		context.removeFolder();
	});

	this.extractionFolderPath = this.extractionPath + s4() + s4();

	this.zipFilePath = options.filePath;

	
	// move back one month so we use only files we need
	var tempDate = new Date(this.startDate.toString()) ;
	tempDate.setMonth(this.startDate.getMonth()-1);
	this.fileStartYear = tempDate.getFullYear();
	this.fileStartMonth = tempDate.getMonth() + 1;


	this.unzipper = new DecompressZip( this.zipFilePath );
	this.extractFile();

	console.log( this.count );
};


Extractor.prototype.extractFile = function(){
	var context = this;

	this.unzipper.on('error', function (err) {
		context.emit('error', err);
	});
	this.unzipper.on('extract', function (log) {
		context.emit('unzipped');
		context.readProfileData();
		context.readTweetData();
	});
	this.unzipper.extract({
		path: this.extractionFolderPath,
		follow: false,
		filter: function (file) {
			return file.type !== 'SymbolicLink';
		}	
	});
};


Extractor.prototype.readProfileData = function(){
	var filePath = this.extractionFolderPath + '/data/js/user_details.js',
		context = this,
		emitFn = function(err, data){
			if(err){
				context.emit('error', err);
			}else{
				context.emit('profile', data);
			}
		};


	fs.readFile(filePath, 'utf-8', function(err, contents) {
		if(contents) {
			var userDetails = context.getObj(contents),
				profile = new Profile();

			profile.parse( userDetails, emitFn );
		}else{
			context.emit('error', err);
		}
	}); 

};



Extractor.prototype.readTweetData = function(){
	var folderPath = this.extractionFolderPath + '/data/js/tweets',
		context = this,
		emitFn = function(err, data, name){
			if(err){
				context.emit('error', err);
			}else{
				context.emit(name, data);
			}
		};

		var extendedNote = new ExtendedNote();

	fs.readdir(folderPath, function(err, files) {
		var apiUrls = [],
			parsedPeople = [],
			lastStat = new Date().getTime(),
			left = files.length;

		files.forEach(function(file) {

			// only read the file if its in date range
			if( context.isfileNameInDateRange(file) ){
				console.log('allow file: ', file);

				var filePath = folderPath + '/' + file;
				fs.readFile(filePath, 'utf-8', function(err, contents) { 
					var tweets = context.getObj(contents),
						i = tweets.length,
						x = 0;
					
					context.emit('file', {name: file, count: tweets.length});

					while (x < i) {
						// only use tweets in date range
						if( context.isEntryInDateRange(tweets[x]) ){
							context.emit('item', tweets[x]);


							// use extended version which parses twitter.com	
							if(context.useExtendedParsing )	{

								context.parseExtendedTweet(tweets[x], function(err, extData, tweet){
									context.parseTweet(tweet, function(err, data, name){
										if(err){
											context.emit('error', err);
										}else{
											context.merge(extData, data, function(err, data, name){
												context.emit(name, data);	
											})
										}
									});
								});
							// use normal version which just parses the JSON files	
							}else{
								context.parseTweet(tweets[x], function(err, data, name){
									if(err){
										context.emit('error', err);
									}else{
										context.emit(name, data);
									}
								});
							}
/*
							if(context.hasUsers( tweets[x] )){
								var person = new Person();
								person.parse( tweets[x], parsedPeople, emitFn )
							}*/

						}else{
							console.log('excluded tweet created on: ', tweets[x].created_at)
						}
						x++;
					}

					// emits current stats ever second
					if(new Date().getTime() >  (lastStat + 1000) ){
						context.emit('stats', context.stats );
						lastStat = new Date().getTime();
					}

					left--;
					if (!left){
						context.emit('done', context.stats);
					} 
				}); 
			}else{
				console.log('excuted file: ', file);
			}

		});
	});

};


// parse tweet from JSON files
Extractor.prototype.parseTweet = function ( tweet, callback ){

	// work out which collection the data belongs in

	if(this.isCheckin( tweet )){
		var checkin = new Checkin();
		checkin.parse( tweet, callback );
	}else if(this.isPhoto( tweet )){
		var photo = new Photo();
		photo.parse( tweet, callback );
	}else if(this.isVideo( tweet )){
		var video = new Video();
		video.parse( tweet, callback );
	}else{
		var note = new Note();
		note.parse( tweet, callback );
	}

	// add data to meta collections
	//if(this.hasLinks( tweets[x] )){
	//	var link = new Link();
	//	link.parse( tweets[x], emitFn )
	//}
};


// parse tweet from JSON files
Extractor.prototype.parseExtendedTweet = function ( tweet, callback ){
	var url = 'http://glennjones.net/tools/to-microformats/twitter/' + tweet.user.screen_name + '/status/' + tweet.id_str + '/';

	// this places request in a queue
	extendedNote.add({'url':url, 'tweet': tweet}, callback);
};


// merge data from JSON and extended twitter page parse
Extractor.prototype.merge = function ( extData, data, callback ){

	// extract name for event fire and merge data
	if(data.items[0].type.indexOf('h-as-checkin') > -1){

		extData.items[0].type[1] = 'h-as-checkin';
		extData.items[0].properties.name = data.items[0].properties.name
		extData.items[0].properties.location = data.items[0].properties.location
		extData.items[0].properties.syndication = data.items[0].properties.syndication
		callback(null, extData, 'checkin');

	}else if(data.items[0].type.indexOf('h-as-photo') > -1){

		extData.items[0].type[1] = 'h-as-photo';
		extData.items[0].properties.photo = data.items[0].properties.photo
		extData.items[0].properties.content = data.items[0].properties.content
		callback(null, extData, 'photo');

	}else if(data.items[0].type.indexOf('h-as-video') > -1){

		extData.items[0].type[1] = 'h-as-video';
		callback(null, extData, 'video');

	}else{
		callback(null, extData, 'note');
	}

};


// is the file in the given date range
Extractor.prototype.isfileNameInDateRange = function ( name ){
	var fileNum = name.replace('.js','').replace('_',''),
		startNum = this.fileStartYear.toString() + this.fileStartMonth.toString();

	if(parseInt(fileNum, 10) >= parseInt(startNum, 10)) {
		return true;
	}
	return false;
};


// returns weather created date is after startDate set in options
Extractor.prototype.isEntryInDateRange = function ( tweet ){
	var created = new Date(tweet.created_at);
	return created.getTime() > this.startDate.getTime();
};


// removes var name and returns JSON obj
Extractor.prototype.getObj = function ( str ){
	str = str.substring( str.indexOf('=')+1 );
	var obj = JSON.parse(str);
	return (obj)? obj : {};
};


// removes the extracted folder from file system
Extractor.prototype.removeFolder = function (){
	fs.remove(this.extractionFolderPath, function(err){
		if (err) {
			return console.error(err);
		}
	});
};


// looks for checkin patterns
Extractor.prototype.isCheckin = function ( tweet ){
	// look forthe foursquare pattern
	if( tweet && tweet.entities && tweet.entities.urls ){
		var i = tweet.entities.urls.length;
		while (i--) {
			if(tweet.entities.urls[i].expanded_url.indexOf('4sq.com') > -1){
				return true;
			}
		}
	}
	return false;
};


// looks for checkin patterns
Extractor.prototype.isPhoto = function ( tweet ){
	if( tweet && tweet.entities && tweet.entities.media ){
		var i = tweet.entities.media.length;
		while (i--) {
			if(tweet.entities.media[i].media_url){
				return true;
			}
		}
	}
	return false;
};


// looks for checkin patterns
Extractor.prototype.isVideo = function ( tweet ){
	return false;
};


// does a tweet mention any users
Extractor.prototype.hasUsers = function ( tweet ){
	if( tweet && tweet.entities && tweet.entities.user_mentions && tweet.entities.user_mentions.length > 0 ){
		return true;
	}
	return false;
};


// does a tweet have any links
Extractor.prototype.hasLinks = function ( tweet ){
	if( tweet && tweet.entities && tweet.entities.urls && tweet.entities.urls.length > 0 ){
		return true;
	}
	return false;
};


function s4() {
	return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
}
 
function guid() {
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
			s4() + '-' + s4() + s4() + s4();
}



exports.Extractor = Extractor;
