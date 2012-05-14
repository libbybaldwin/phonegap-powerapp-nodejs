# PhoneGap PowerApp Node.js Server

## Companion Server for [PhoneGap PowerApp](https://github.com/libbybaldwin/phonegap-powerapp)
or Stand-alone Demo of Node.js Server

### Requiremens and Modules:

* **Node.js** - Developed with Version 0.6.13 on Ubuntu 11.04
  * __*Requires*__ installation of [Node.js](http://nodejs.org/)
* **Session Store** - [session.js](https://github.com/Marak/session.js)
* **Key/Value Store** - [node-dirty](https://github.com/felixge/node-dirty)
* **Authentication** - [OpenID for node.js](https://github.com/havard/node-openid)

### Functionality Includes:

* *Security* - Secure Login using [OpenID](http://openid.net/)
* *Secure User Space for Data Store* - Unique user ID from authentication holds user-uploaded data
* *User-controlled Data Sharing* - Data stored anonymously, sharing controlled by user

### Installation and Setup:

* * __*Requires*__ installation of [Node.js](http://nodejs.org/)
* Edit the following before starting server:
  * **install_dir/server/myUrl.js** - vars **rawUrl** and **port** must set to server ip and port
* To run server:
  * **$ cd install_dir**
  * **$ node server/server.js**
* See **install_dir/readme.txt** for further instructions

------

Libby Baldwin, [Mobile Developer Solutions](http://www.mobiledevelopersolutions.com)

