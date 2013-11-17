'use strict';

var fs				= require('fs-extra'),
	path			= require('path'),
	util			= require('util'),
	events			= require('events'),
	util			= require('util'),
	DecompressZip	= require('decompress-zip'),
	Note			= require('./note').Note,
	Profile			= require('./profile').Profile;




function Extractor( options ) {
	events.EventEmitter.call(this);
	this.extractionPath = (options && options.extractionPath)? options.extractionPath : path.join(__dirname, '../zipextraction/');
}

util.inherits(Extractor, events.EventEmitter);

Extractor.prototype.extract = function( zipFilePath ){
	var context = this;

	this.stats = {
		'files': 0,
		'items': 0,
		'notes': 0,
		'people': 0,
		'photos': 0,
		'videos': 0,
		'checkins': 0,
		'tags': 0,
		'urls': 0,	
		'errors': 0
	}

	// use objects own events to update stats
	this.on('file', function(){ context.stats.files ++;});
	this.on('item', function(){ context.stats.items ++;});
	this.on('note', function(){ context.stats.notes ++;});
	this.on('person', function(){ context.stats.people ++;});
	this.on('photo', function(){ context.stats.photos ++;});
	this.on('video', function(){ context.stats.videos ++;});
	this.on('checkin', function(){ context.stats.checkins ++;});
	this.on('tag', function(){ context.stats.tags ++;});	
	this.on('url', function(){ context.stats.urls ++;});
	this.on('error', function(){ context.stats.errors ++;});

	this.on('done', function(){ 
		context.removeFolder();
	});

	this.extractionFolderPath = this.extractionPath + s4() + s4();
	this.zipFilePath = zipFilePath ;

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
		var profile = context.getObj(contents),
			profile = new Profile();

		profile.parse( profile, emitFn );
	}); 

};



Extractor.prototype.readTweetData = function(){
	var folderPath = this.extractionFolderPath + '/data/js/tweets',
		context = this,
		emitFn = function(err, data){
			if(err){
				context.emit('error', err);
			}else{
				context.emit('note', data);
			}
		};

	fs.readdir(folderPath, function(err, files) {
    	var lastStat = new Date().getTime() ,
    		left = files.length;
		files.forEach(function(file) {
			var filePath = folderPath + '/' + file;
			fs.readFile(filePath, 'utf-8', function(err, contents) { 
				var tweets = context.getObj(contents),
					note = new Note(),
					i = tweets.length,
					x = 0;
				
				context.emit('file', {name: file, count: tweets.length});
				while (x < i) {
					context.emit('item', tweets[x]);
					note.parse( tweets[x], emitFn);
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
		});
	});
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
