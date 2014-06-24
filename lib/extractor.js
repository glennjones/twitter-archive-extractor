'use strict';

var fs				= require('fs-extra'),
	path			= require('path'),
	util			= require('util'),
	events			= require('events'),
	util			= require('util'),
	DecompressZip	= require('decompress-zip'),
	utils         	= require('./utils'),
	expand			= require('./expand'),
	Note			= require('./note').Note,
	Checkin			= require('./checkin').Checkin,
	Photo			= require('./photo').Photo,
	Video			= require('./video').Video,
	Link			= require('./link').Link,
	Person			= require('./person').Person,
	Profile			= require('./profile').Profile,
	ExtendedNote	= require('./extended-note').ExtendedNote,
	Timeline		= require('./timeline').Timeline;

// set globally to share queue
var extendedNote = new ExtendedNote();
var timeline = new Timeline();


function Extractor( options ) {
	events.EventEmitter.call(this);

	// sets to defaults if options not passed
	this.extractionPath = (options && options.extractionPath)? options.extractionPath : path.join(__dirname, '../zipextraction/');
	this.useExtendedParsing = (options && options.useExtendedParsing)? options.useExtendedParsing : false;
}

util.inherits(Extractor, events.EventEmitter);


// parse timeline
Extractor.prototype.getTimeLine = function ( options, callback ){
	timeline.add(options, callback);
};


Extractor.prototype.extract = function( options, callback ){
	var context = this;

	this.useExtendedParsing = (options && options.useExtendedParsing)? options.useExtendedParsing : false;
	this.startDate = (options.startDate)? options.startDate : new Date(2006,3,21); // start date of twitter

	this.fileCount = 0;
	this.completedFiles = 0;
	this.itemCount = 0;
	this.completedItems = 0;
	this.erroredItems = 0;
	this._data = {
		person: [],
		note: [],
		photo: [],
		checkin: [],
		sgn: [],
		error: []
	};
	this._callback = callback;

	this._stats = {
		'file': 0,
		'item': 0,
		'note': 0,
		'person': 0,
		'photo': 0,
		'checkin': 0,
		'sgn': 0,	
		'error': 0
	};

	this.urls = [];

	// use objects own events to update stats
	this.on('file', function(data){ context._stats.file ++;});
	this.on('item', function(data){ context._stats.item ++;});
	this.on('note', function(data){ 
		context._stats.note ++;
		context._data.note.push( data );
	});
	this.on('person', function(data){ 
		context._stats.person ++;
		context._data.person.push( data );
	});
	this.on('photo', function(data){ 
		context._stats.photo ++;
		context._data.photo.push( data );
	});
/*	this.on('video', function(data){ 
		context._stats.video ++;
		context._data.video.push( data );
	});*/
	this.on('checkin', function(data){ 
		context._stats.checkin ++;
		context._data.checkin.push( data );
	});
/*	this.on('tag', function(data){ 
		context._stats.tag ++;
		context._data.tag.push( data );
	});	
	this.on('link', function(data){ 
		context._stats.link ++;
		context._data.link.push( data );
	});*/
	this.on('sgn', function(data){ 
		context._stats.sgn ++;
		context._data.sgn.push( data );
	});
	this.on('error', function(data){ 
		context._stats.error ++;
		context._data.error.push( data );
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
};


// checks to see if we have parsed all the files and exec callback
Extractor.prototype.isComplete = function(){
	//console.log(this.fileCount, this.completedFiles, this.itemCount, this.completedItems + this.erroredItems)
	if(this.fileCount === this.completedFiles && this.itemCount === this.completedItems + this.erroredItems){
		if(this._callback){
			this._callback( null, this._data, this._stats )	
		}
		this.emit('done', this._data, this._stats);
		this.removeFolder();
	}
}


Extractor.prototype.extractFile = function(){
	var context = this;

	// asynchronous unzip events
	this.unzipper.on('error', function (err) {
		context.emit('error', err);
	});
	this.unzipper.on('extract', function (log) {
		context.emit('unzipped');
		context.readProfileData( );
		context.readTweetData( );
	});
	this.unzipper.extract({
		path: this.extractionFolderPath,
		follow: false,
		filter: function (file) {
			return file.type !== 'SymbolicLink';
		}	
	});
};


// reads profile data 
Extractor.prototype.readProfileData = function( ){
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
			emitFn( err, null )
		}
	}); 

};


// reads tweet data files and if file is in date range pass ikt to parse function
Extractor.prototype.readTweetData = function( ){
	var folderPath = this.extractionFolderPath + '/data/js/tweets',
		context = this;

	fs.readdir(folderPath, function(err, files) {
		var apiUrls = [],
			parsedPeople = [],
			lastStat = new Date().getTime();

		var i = files.length;
		while (i--) {
		    var file = files[i]
		    if( context.isfileNameInDateRange(file) ){
				//console.log('allow file: ', file);
				var filePath = folderPath + '/' + file;
				context.fileCount +=1; 
				context.readTweetFile( filePath, parsedPeople );
			}else{
				//console.log('excuted file: ', file);
			}
		}



	/*	files.forEach(function(file) {
			// only read the file if its in date range
			if( context.isfileNameInDateRange(file) ){
				//console.log('allow file: ', file);
				var filePath = folderPath + '/' + file;
				context.fileCount +=1; 
				context.readTweetFile( filePath, parsedPeople );
			}else{
				//console.log('excuted file: ', file);
			}
		});*/
	});
};



// reads tweetfile 
Extractor.prototype.readTweetFile = function( filePath, parsedPeople ){
	var context = this,
		extendedNote = new ExtendedNote();		
		

	fs.readFile(filePath, 'utf-8', function(err, contents) { 
		var tweets = context.getObj(contents),
			i = tweets.length,
			fileItems = 0,
			fileItemsParsed = 0,
			x = 0;
			
			
		context.emit('file', {name: filePath, count: tweets.length});

		// loop to build list of actionable objects and create 'itemCount' count
		var items = [];
		while (x < i) {
			// only use tweets in date range
			if( context.isEntryInDateRange(tweets[x]) ){
				context.emit('item', tweets[x]);
				items.push( tweets[x] )
				context.itemCount  +=1;
			}else{
				//console.log('excluded tweet created on: ', tweets[x].created_at)
			}
			x++;
		}

		items.reverse();

		// loop item list to process tweets
		i = fileItems = items.length,
		x = 0;
		while (x < i) {

			var item = items[x];
			
				// parse usernames and emit event data for person and sgn
				context.parseUsernames( item, parsedPeople );
				
				// use extended version which parses twitter.com page	
				if(context.useExtendedParsing )	{
					context.parseExtendedTweet(item , function(err, extData, tweet){
						context.parseTweet(tweet, function(err, data, name){
							if(err){
								fileItemsParsed +=1;
								context.emitAndCount(err, data, name, fileItems, fileItemsParsed );
							}else{
								context.merge(extData, data, function(err, data, name, hasChanged){
									fileItemsParsed +=1;
									context.emitAndCount(err, data, name, fileItems, fileItemsParsed );
								})
							}
						});
					});
				// use normal version which just parses the JSON file data
				}else{
					//setTimeout(
						//function(context, item, fileItems, fileItemsParsed){
							//return function(){
								context.parseTweet(item, function(err, data, name){
									fileItemsParsed +=1;
									context.emitAndCount(err, data, name, fileItems, fileItemsParsed );
								});
							//}
						//}, 
					//(10 * x), context, item, fileItems, fileItemsParsed);
				}
			
			x++;
		}
	});

}


Extractor.prototype.parseUsernames = function ( tweet, parsedPeople ){
	var context = this,
		emitFn = function(err, data, name){
			if(err){
				context.emit('error', err);
			}else{
				context.emit(name, data);
			}
		};

	if(context.hasUsers( tweet )){
		var person = new Person();
		person.parse( tweet, parsedPeople, emitFn )
	}
}


// fired once an item has been processes emit data event and captures counts
Extractor.prototype.emitAndCount = function (err, data, name, fileItems, fileItemsParsed){
	if(err){
		this.emit('error', err);
	}else{
		this.emit(name, data);
	}
	// are all items for this file complated
	if(	fileItems === fileItemsParsed ){
		this.completedFiles +=1;
	}

	// are all item for full archieve completed
	this.completedItems +=1;
	this.isComplete();
}




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

};


// parse tweet from JSON files
Extractor.prototype.parseExtendedTweet = function ( tweet, callback ){
	var url = 'http://glennjones.net/tools/to-microformats/twitter/' + tweet.user.screen_name + '/status/' + tweet.id_str + '/';

	// this places request in a queue
	extendedNote.add({'url':url, 'tweet': tweet}, callback);
};




// merge data from JSON and extended twitter page parse
Extractor.prototype.merge = function ( extData, data, callback ){
	var hasChanged = false;

	if(extData && data){
		var	reply = this.mergeInReplyTo( extData, data ),
			comment = this.mergeComment( extData, data ),
			like = this.mergeLike( extData, data );

		if( reply === true || comment === true || like === true ){
			hasChanged = true;
		}	
	}else{
		//console.log('there was no extended twitter data passed to merge')
	}

	if(data.items[0].type.indexOf('h-as-checkin') > -1){
		callback(null, data, 'checkin', hasChanged);
	}else if(data.items[0].type.indexOf('h-as-photo') > -1){
		callback(null, data, 'photo', hasChanged);
	}else if(data.items[0].type.indexOf('h-as-video') > -1){
		callback(null, data, 'video', hasChanged);
	}else{
		callback(null, data, 'note', hasChanged);
	}
};


Extractor.prototype.mergeComment = function ( extData, data ){
	var hasUpdated = false;

	if(extData.items[0].properties.comment ){

		if(!data.items[0].properties.comment){
			data.items[0].properties.comment = [];
		}

	}
	if(extData.items[0].properties.comment ){
		//console.log('has comments')

		if(!data.items[0].properties.comment){
			data.items[0].properties.comment = [];
		}

		var extComment = extData.items[0].properties.comment,
			comments = data.items[0].properties.comment,
			i = extComment.length,
			x = 0;

		while (x < i) {
			var z = comments.length,
				y = 0,
				found = false;

			while (y < z) {
				if( comments[y].properties.url[0] === extComment[x].properties.url[0]){
					comments[y] = extComment[x]
					found = true;
				}
				y++;
			}
			if(!found){
				comments.push( extComment[x] )
				hasUpdated = true;
				//console.log('adding comment', extComment[x].properties.url[0])
			}
		    x++;
		}

		// order by date
		comments.sort(compare);
		data.items[0].properties.comment = comments;

	}
	return hasUpdated
}


Extractor.prototype.mergeLike = function ( extData, data ){
	var hasUpdated = false;

	if(extData.items[0].properties.like ){
		//console.log('has likes')

		if(!data.items[0].properties.like){
			data.items[0].properties.like = [];
		}

		var extLikes = extData.items[0].properties.like,
			likes = data.items[0].properties.like,
			i = extLikes.length,
			x = 0;

		while (x < i) {
			var z = likes.length,
				y = 0,
				found = false;

			while (y < z) {
				if( likes[y].properties.author[0].properties.url[0] === extLikes[x].properties.author[0].properties.url[0]){
					likes[y] = extLikes[x]
					found = true;
				}
				y++;
			}
			if(!found){
				likes.push( extLikes[x] )
				hasUpdated = true;
				//console.log('adding like', extLikes[x].properties.author[0].properties.url[0])
			}
		    x++;
		}
	}
	return hasUpdated
}


Extractor.prototype.mergeInReplyTo = function ( extData, data ){
	var hasUpdated = false;

	if(extData && extData.items[0].properties['in-reply-to'] ){

		if(!data.items[0].properties['in-reply-to']){
			data.items[0].properties['in-reply-to'] = [];
		}


		var extReplies = extData.items[0].properties['in-reply-to'],
			replies = data.items[0].properties['in-reply-to'],
			i = extReplies.length,
			x = 0;

		// loop extended in-reply-to
		while (x < i) {
			var z = replies.length,
				y = 0,
				found = false;

			// loop existing in-reply-to
			while (y < z) {
				if( utils.isString( replies[y] ) === false ){
					//console.log('matching', replies[y].properties.url[0],extReplies[x].properties.url[0])
					// if existing in-reply-to = extended in-reply-to, then replace it
					if( replies[y].properties.url[0] === extReplies[x].properties.url[0]){
						replies[y] = extReplies[x]
						found = true;
						//console.log('found')
					}
				}

				y++;
			}
			if(!found){
				// does not exsits add it
				replies.push( extReplies[x] )

				// add rels as well
				if(!data.rels){
					data.rels ={};
				}
				if(!data.rels['in-reply-to']){
					data.rels['in-reply-to'] = [];
				}
				if(data.rels['in-reply-to'].indexOf( extReplies[x].properties.url[0] ) === -1){
					data.rels['in-reply-to'].push( extReplies[x].properties.url[0] );
				}
				
				hasUpdated = true;
				//console.log('adding in-reply-to', extReplies[x].properties.url[0])
			}

		    // is url a string in 
		    x++;
		}

		// if existing in-reply-to is string with twitter status patten remove it
		while (z--) {
			if( utils.isString( replies[z] ) && this.isStatusUrl( replies[z] ) ){
				replies.splice(z, 1);
			}	
		}

		// order by date
		replies.sort(compare);
		data.items[0].properties['in-reply-to'] = replies;
	}else{
		//console.log('no "in-reply-to" data from parse of status')
	}
	return hasUpdated
}



function compare(a,b) {
	var pubA = new Date(a.properties.published[0]),
		pubB = new Date(b.properties.published[0]);

  if ( pubA.getTime() < pubB.getTime() ){
  	return -1;
  }
  return 0;
}



Extractor.prototype.updateEntryMentions = function ( entry, callback ){
  	//console.log( 'updateEntryMentions' );

  	var context = this,
  		item,
  		syndicationLink;

  	// has items collection
  	if(entry && entry.items && utils.isArray(entry.items)){

  		// simple deep clone of object
  		var updatedEntry = utils.clone( entry );

  		//has "h-entry" type
  		if(entry.items[0].type && entry.items[0].type.indexOf('h-entry') > -1){

			// has sync property with twitter status url pattern
  			item = entry.items[0];	
  			if(item.properties && item.properties.syndication){
				var i = item.properties.syndication.length;
				while (i--) {
				    if( this.isStatusUrl( item.properties.syndication[i] ) ){
				    	syndicationLink = item.properties.syndication[i];
				    }
				}
  			}
  			if(syndicationLink){

				// get extended data
  				var extendedNote = new ExtendedNote();
  				var url = 'http://glennjones.net/tools/to-microformats/twitter/' + syndicationLink.replace('https://twitter.com/','') + '/';

  				// call parse direct async with a 0 delay
				extendedNote.parse({'url':url, delay: 0}, function(err, extData){
					context.merge( extData, updatedEntry, function( err, out, name, hasChanged){
						callback(err, updatedEntry, hasChanged)
					});	
				});

  			}else{
  				callback('has no twitter status syndication link', entry, false)
  			}
  		}else{
	  		callback('this object does not have type property h-entry', entry, false)
	  	}
  	}else{
  		callback('is not a object or does not have items collection', entry, false)
  	}

};


Extractor.prototype.getUserMentions = function ( username, days, callback ){
	console.log( username, days );

};




Extractor.prototype.isStatusUrl = function ( url ){
	if(url.indexOf('https://twitter.com/') === 0 && url.indexOf('/status/') > -1){
		return true;
	}
	return false;
}



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
