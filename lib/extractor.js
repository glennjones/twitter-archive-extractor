'use strict';

var fs				= require('fs'),
	path			= require('path'),
	util			= require('util'),
	events			= require('events'),
	util			= require('util'),
	DecompressZip	= require('decompress-zip'),
	hItems			= require('./h-items').hItems;




function Extractor( options ) {
	events.EventEmitter.call(this);
	this.extractionPath = (options && options.extractionPath)? options.extractionPath : path.join(__dirname, '../zipextraction/');
}

util.inherits(Extractor, events.EventEmitter);

Extractor.prototype.extract = function( filePath ){
	var context = this;

	this.count = 0;
	this.tags = 0;
	this.usernames = 0;
	this.urls = 0;
	this.photos = 0;
	this.videos = 0;

	this.extractFolder = this.extractionPath + s4() + s4();
	this.filePath = filePath;

	this.unzipper = new DecompressZip( this.filePath );
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
		context.readFiles();
	});
	this.unzipper.extract({
		path: this.extractFolder,
		follow: false,
		filter: function (file) {
			return file.type !== 'SymbolicLink';
		}	
	});
};



Extractor.prototype.readFiles = function(){
	var folderPath = this.extractFolder + '/data/js/tweets',
		context = this,
		emitFn = function(err, data){
			if(err){
				context.emit('error', err);
			}else{
				context.emit('items', data);
			}
		};

	fs.readdir(folderPath, function(err, files) {
		files.forEach(function(file) {
			var filePath = folderPath + '/' + file;
			fs.readFile(filePath, 'utf-8', function(err, contents) { 
				var tweets = context.getArray(contents),
					hitems = new hItems(),
					i = tweets.length,
					x = 0;
				
				context.emit('file', {name: file, count: tweets.length});
				context.count += tweets.length;
				while (x < i) {
					context.count ++;
					hitems.parse( tweets[x], emitFn);
					x++;
				}
			}); 
		});

		// add folder remove need to replace for each with sync loop
	});
};


// removes var name and returns JSON obj
Extractor.prototype.getArray = function ( str ){
	str = str.substring( str.indexOf('=')+1 );
	var obj = JSON.parse(str);
	return (obj)? obj : {};
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


/*

var fs                  = require('graceful-fs'),
	path                = require('path'),
	microformats        = require('microformat-node'),
	handlebars			= require('handlebars');


var dates = [];



// find all html files in a folder and get contents
function importTweets( folderPath, exportPath ){

	console.log('importTweets', path.join(__dirname, '../templates/tweet.html') )
	var source = fs.readFileSync(path.join(__dirname, '../templates/tweet.html'), 'utf8');
	var template = handlebars.compile(source);

	fs.readdir(folderPath, function(err, files) {
		files.forEach(function(file) {
			var filePath = folderPath + '/' + file;
			console.log(filePath)
			fs.readFile(filePath, 'utf-8', function(err, contents) { 
				buildFiles( getObj(contents), exportPath, template ); 
			}); 
		});
	});

}

// removes var name and returns JSON obj
function getObj( str ){
	str = str.substring( str.indexOf('=')+1 );
	return JSON.parse(str)
}



// parse html content and set file creation date to pub date in h-entry
function buildFiles( tweets, exportPath, template ) {
	var i = tweets.length;
	while (i--) {
		var fileName = getFileName( tweets[i].created_at );
		console.log( fileName )

		addGeo( tweets[i] )
		addDate( tweets[i] )
		addContent( tweets[i] )
		addTweetUrl( tweets[i] )
		html = template( tweets[i] )

		writeFile(exportPath, fileName, html)
	}

}

function writeFile(exportPath, fileName, contents){
	fs.writeFile(exportPath + '/' + fileName, contents, function (err) {
		console.log(fileName, err);
	});
}


function addTweetUrl( tweet ){
	//https://twitter.com/glennjones/status/375292950273875968
	tweet['twitter-url'] = "https://twitter.com/" + tweet.user.screen_name + '/status/' + tweet.id_str
}


function addContent( tweet ){
	words = tweet.text.split(' ')
	var i = words.length;
	while (i--) {
		if(words[i].indexOf('http') === 0 || words[i].indexOf('https') === 0){
			words[i] = '<a class="auto-link" href="' + words[i] + '">' + words[i] + '</a>';
		}
		if(words[i].indexOf('@') === 0){
			words[i] = '<a class="auto-link h-x-username" href="https://twitter.com/' + words[i].replace('@','') + '">' + words[i] + '</a>';
		}
		if(words[i].indexOf('#') === 0){
			words[i] = '<a class="auto-link hashtag" href="https://twitter.com/search?q=' + encodeURIComponent(words[i]) + '&src=hash">' + words[i] + '</a>';
		}
	}
	tweet.content = words.join(' ')
}


function addGeo( tweet ){
	if(tweet.geo && tweet.geo.coordinates){
		tweet.latitude = tweet.geo.coordinates[0]
		tweet.longitude = tweet.geo.coordinates[1]
	}
}


function addDate( tweet ){
	var items = tweet.created_at.split(' ')
	tweet.published = items[0] + 'T' + items[1] + items[2]
}


// returns a filename based on date plus counter for day
function getFileName( dateStr ){
	//2013-09-04 16:23:06 +0000
	var items = dateStr.split(' ')
	return items[0] + '-' + pad( getDateCount( items[0] ) ) + '.html';
}    


// pads a number 01 instead of 1
function pad(n) {
  return n < 10 ? '0' + n : n
}	


// returns the number of uses a given date during the whole process
function getDateCount( dateStr ){
	//2013-09-04

	var i = dates.length;
	while (i--) {
		if(dates[i].date === dateStr){
			dates[i].count ++;
			return dates[i].count;
		}
	}
	dates.push ({
		date: dateStr,
		count: 1
	})
	return 1;
}



exports.importTweets = importTweets;*/