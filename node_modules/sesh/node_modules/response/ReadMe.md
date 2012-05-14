# response - beefs up and extends node's http.ServerResponse object


## Installation 

  npm install response
  
  
## Usage

    require('response');


Now http.ServerResponse is monkey patched with additional methods.
    

### ServerResponse.setHeader Example

    var http     = require('http');
    
    require('response');

    http.createServer(function (req, res) {
      var content = 'hello, i know nodejitsu.';

      res.setHeader('Content-Length', content.length);
      res.setHeader('Foo-Bar', 'A');
      res.setHeader('Foo-Tar', 'B');

      res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Foo-Tar': 'C'
      });
  
      res.write(content);
      res.end();
    }).listen(8080);


#### Response Headers

    Content-Type	text/plain
    Foo-Tar	C
    Content-Length	21
    Foo-Bar	A
    Connection	keep-alive
    
    
## Authors

Alexis Sellier (cloudhead), Marak Squires