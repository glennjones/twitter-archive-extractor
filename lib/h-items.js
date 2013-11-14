// construct a (h-entry h-as-note) from tweet JSON


function hItems( tweet, callback ){
    this.out = {
        "items": [{
                "type": ["h-entry","h-as-note"],
                "properties": {}
            }],
        "rels": {},
    }

    this.tweet = tweet;
    this.text = '';
    this.html = '';
    this.tags = [];
    this.links = [];
    this.urls = [];
    this.usernames = [];


    var prop = this.out.items[0].properties


    // add content ie plain text and html
    if(tweet.text){
        this.text = tweet.text;
        // parse the text into data collections
        this.parseText();

        prop.contents = [{
            value: this.text,
            html: this.html
        }]
    }

    // add date
    if(tweet.created_at){
        prop.published = [formatDate(tweet.created_at)];
    }

    // add converted hashtags as tags - this.parseText() need to be called first
    if(this.tags.length > -1){
        prop.category = this.tags;
    }

    // add syndication url and uid
    if(tweet.id){
        prop.syndication = ["https://twitter.com/" + tweet.user.screen_name + '/status/' + tweet.id_str];
        prop.uid = prop.syndication;
    }

    // add geo data if its in the point format
    if(tweet.geo && tweet.geo.type && tweet.geo.type === 'Point'){
        prop.location = {
            "type": ["h-geo"],
            "properties": {
                "latitude": tweet.geo.coordinates[0],
                "longitude": tweet.geo.coordinates[1]
            }
        }
    }

    callback(null, this.out)
}


hItems.prototype = {


    // parse the text into data collections
    parseText: function( text ){
        this.words = this.text.split(' ')
        var i = this.words.length;
        while (i--) {
            var word = trim( this.words[i] )
            if(word.indexOf('http') === 0 || word.indexOf('https') === 0){
                var expanded = this.expandURL(word);
                this.links.push( expanded );
                this.words[i] = '<a class="auto-link" data-shorten="' + word + '" href="' + expanded + '">' + expanded + '</a>';
                this.text = this.text.replace( word, expanded )
            }
            if(word.indexOf('@') === 0){
                this.usernames.push( word.replace(/@/g,'').toLowerCase() );
                this.words[i] = '<a class="auto-link h-x-username" href="https://twitter.com/' + word.replace('@','') + '">' + word + '</a>';
            }
            if(word.indexOf('#') === 0){
                this.tags.push( word.replace(/#/g,'').toLowerCase() );
                this.words[i] = '<a class="auto-link hashtag" href="https://twitter.com/search?q=' + encodeURIComponent(word) + '&src=hash">' + word + '</a>';
            }
        }
        this.html = this.words.join(' ')
    },


    expandURL: function( url ){
        if(this.tweet && this.tweet.entities.urls.length > 0){
            var i = this.tweet.entities.urls.length,
                x = 0;
            while (x < i) {
                if(url === this.tweet.entities.urls[x].url){
                    url = this.tweet.entities.urls[x].expanded_url;
                    break
                }
                x++;
            }
        }
        return url
    }

}


function formatDate( date ){
    var items = date.split(' ')
    return items[0] + 'T' + items[1] + items[2];
}

function trim( str ) {
    return str.replace(/^\s+|\s+$/g, "");
}



exports.hItems = hItems;


/*{
    "source": "<a href=\"http://www.tweetdeck.com\" rel=\"nofollow\">TweetDeck</a>",
    "entities": {
        "user_mentions": [
            {
                "name": "Full Frontal",
                "screen_name": "fullfrontalconf",
                "indices": [
                    19,
                    35
                ],
                "id_str": "26049747",
                "id": 26049747
            }
        ],
        "media": [],
        "hashtags": [],
        "urls": []
    },
    "geo": {},
    "id_str": "398723231479508992",
    "text": "Looking forward to @fullfrontalconf today, javascript and fish and chips all just 500m from my house : )",
    "id": 398723231479509000,
    "created_at": "2013-11-08 08:06:40 +0000",
    "user": {
        "name": "Glenn Jones",
        "screen_name": "glennjones",
        "protected": false,
        "id_str": "946491",
        "profile_image_url_https": "https://pbs.twimg.com/profile_images/1442481406/Glenn_Jones_normal.png",
        "id": 946491,
        "verified": false
    }
}*/