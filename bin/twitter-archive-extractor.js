

var http          = require('http'),
    util          = require('util'),
    app           = require('http').createServer(handler),
    fs            = require('fs'),
    StringDecoder = require('string_decoder').StringDecoder,
    formidable    = require('formidable');
    utils         = require('../lib/utils'),
    Extractor     = require('../lib/extractor').Extractor;


function handler(req, res) {

  // get the query object
  var query = require('url').parse(req.url, true).query,
      path = null,
      useExtendedParsing = false,
      extendLastNDays = 0,
      start = new Date(),
      count = 0;

  if (req.url === '/') {
    if( req.method === 'GET' ){
      writeHTML('/../static/index.html');
    }
    if( req.method === 'POST' ){

      var form = new formidable.IncomingForm();

      // collect the file path
      form.on('file', function(name, file) {
        console.log(file.path)
        if(file.type === 'application/zip'){
          path = file.path
        }else{
          writeHTMLError( 'A twitter archive should be a zip file' );
        }
      });


      // collect form fields
      form.on('field', function(name, value) {
          if(name === 'useextendedparsing'){
            useExtendedParsing = true;
          }
          if(name === 'extendlastndays'){
            extendLastNDays = value;
          }
      });


      // when form data parse ends
      form.on('end', function() {

        if(path){

          var extractor = new Extractor();

          // display output in the console
          // -------------------------------


          extractor.on('file',function(data){
            console.log( 'found', data.count, 'status updates in file:', data.name );
          })


          extractor.on('profile',function(data){
            console.log( 'found profile', JSON.stringify(data) );
          })


          extractor.on('note',function(data){
            var url = '';
            if(data){
              url = data.items[0].properties.syndication[0]
            }
            console.log( 'found note', url );
          })


          extractor.on('photo',function(data){
            var url = '';
            if(data){
              url = data.items[0].properties.syndication[0]
            }
            console.log( 'found photo', url );
          })


          extractor.on('checkin',function(data){
            var url = '';
            if(data){
              url = data.items[0].properties.syndication[0]
            }
            console.log( 'found checkin', url );
          })


          extractor.on('person',function(data){
            var nickname = [''];
            if(data){
              nickname = data.items[0].children[0].properties.nickname
            }
            console.log( 'found person', nickname[0] );
          })


          extractor.on('sgn',function(data){
            console.log( 'found sgn', JSON.stringify(data) );
          })


          extractor.on('stats',function(data){
            console.log( 'stats ', JSON.stringify(data) );
          })
            

          extractor.on('done',function(data, counts){
            console.log( 'done ', JSON.stringify(counts) );
            //clearInterval(interval);
          })

          // -------------------------------

      /*    var date = new Date();
          var interval = setInterval(function(){
            console.log('interval:', (new Date().getTime() - date.getTime()) + 'ms')
            date = new Date();
          }, 10)*/


          var extractOptions = {
            'filePath': path,
            'startDate': new Date('2005-12-31T23:59:59'),
            'useExtendedParsing': useExtendedParsing,
            'extendLastNDays': extendLastNDays
          }
          extractor.extract( extractOptions );

        }

      });

      form.parse(req, function(err, fields, files) {
        pramas = fields
      });

    }

  }


  if (req.url === '/updateentrymentions' && req.method === 'POST') {
      var json = {},
          form = new formidable.IncomingForm();

      // collect form fields
      form.on('field', function(name, value) {
          if(name === 'json' && value && value !== ''){
            json = JSON.parse( value );
          }
      });

      form.on('end', function() {
          var extractor = new Extractor();
          extractor.updateEntryMentions( json, function(err, data, hasChanged){
            console.log('request done', err, JSON.stringify(data), hasChanged);
          });


          writeHTML('/../static/index.html');
      })


      form.parse(req, function(err, fields, files) {
        pramas = fields
      });

  }

   if (req.url === '/gettimeline' && req.method === 'POST') {
      var options = {},
          form = new formidable.IncomingForm();

      // collect form fields
      form.on('field', function(name, value) {
         if(name === 'twitterusername'){
            options.twitterUsername = value;
          }
          if(name === 'username'){
            options.username = value;
          }
      });

      form.on('end', function() {
          var extractor = new Extractor();
          extractor.getTimeline( options, function(err, data, hasChanged){
            console.log('request done', err, JSON.stringify(data), hasChanged);
          });

          writeHTML('/../static/index.html');
      })


      form.parse(req, function(err, fields, files) {
        pramas = fields
      });

  }




  if (req.url.indexOf('/javascript/') > -1 && !query.url) {
    writeJS(req.url);
  }

  if (req.url.indexOf('/css/') > -1 && !query.url) {
    writeCSS(req.url);
  }


  function writeHTMLError( errMsg ){
    path = '/../static/error.html'
    res.writeHead(200, {'Content-Type': 'text/html'});
    fs.readFile(__dirname + path, function (err, page) {
      if(err) {
        console.log(err)
      }else{
        var decoder = new StringDecoder('utf8');
        var pageStr = decoder.write(page);
        pageStr = pageStr.replace(/{{error}}/g, errMsg)
        res.write(pageStr);
      }
      res.end();
    });
    return;
  };

  function writeHTML(path){
    res.writeHead(200, {'Content-Type': 'text/html'});
    fs.readFile(__dirname + path, function (err, page) {
      if(err) {
        console.log(err)
      }else{
        res.write(page);
      }
      res.end();
    });
    return;
  };


  function writeStaticHTML(path){
    path = '/../static/' + path;
    res.writeHead(200, {'Content-Type': 'text/html'});
    fs.readFile(__dirname + path, function (err, page) {
      if(err) {
        console.log(err)
      }else{
        res.end(page);
      }
    });
    return;
  };


  function writeJS(path){
    var parts = path.split('/javascript/');
    path = '/../static/javascript/' + parts[1];
    res.writeHead(200, {'Content-Type': 'text/javascript'});
    fs.readFile(__dirname + path, function (err, page) {
      if(err) {
        console.log(err)
      }else{
        res.end(page);
      }
    });
    return;
  };

  function writeCSS(path){
    var parts = path.split('/css/');
    path = '/../static/css/' + parts[1];
    res.writeHead(200, {'Content-Type': 'text/css'});
    fs.readFile(__dirname + path, function (err, page) {
      if(err) {
        console.log(err)
      }else{
        res.end(page);
      }
    });
    return;
  };


  function writeImages(path){
    var parts = path.split('/images/');
    path = '/../static/images/' + parts[1];
    fs.readFile(__dirname + path, function (err, img) {
      if(err) {
        console.log(err)
      }else{
        res.writeHead(200, {'Content-Type': 'image/gif' });
        res.end(img, 'binary');
      }
    });
    return;
  };



}

app.listen(8888, 'localhost');
console.log('App @ http://localhost:8888');