

var http          = require('http'),
    util          = require('util'),
    app           = require('http').createServer(handler),
    fs            = require('fs'),
    StringDecoder = require('string_decoder').StringDecoder,
    formidable    = require('formidable');
    Extractor     = require('../lib/extractor').Extractor;


function handler(req, res) {

  // get the query object
  var query = require('url').parse(req.url, true).query,
      start = new Date(),
      count = 0;

  if (req.url === '/') {
    if( req.method === 'GET' ){
      writeHTML('/../static/index.html');
    }
    if( req.method === 'POST' ){

      var form = new formidable.IncomingForm();
      form.on('file', function(name, file) {
        console.log(file.path)
        if(file.type === 'application/zip'){
          var extractor = new Extractor();

          // display output in the console
          // -------------------------------

          extractor.on('items',function(data){
            count ++;
            console.log( 'items parsed: ' + count + ' - in ' + (new Date().getTime() - start.getTime()) + 'ms' );
          })

          extractor.on('file',function(data){
            console.log( 'found ' + data.count + ' in file: ' + data.name );
          })

          extractor.on('profile',function(data){
            console.log( 'found ' + JSON.stringify(data) );
          })

          extractor.on('stats',function(data){
            console.log( 'stats ' + JSON.stringify(data) );
          })

          extractor.on('done',function(data){
            console.log( 'done ' + JSON.stringify(data) );
          })

          // -------------------------------


          extractor.extract( file.path );
        }else{
          writeHTMLError( 'A twitter archive should be a zip file' );
        }
      })

      form.parse(req, function(err, fields, files) {});
    }
  }else if (req.url.indexOf('/javascript/') > -1 && !query.url) {
    writeJS(req.url);
  }else if (req.url.indexOf('/css/') > -1 && !query.url) {
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