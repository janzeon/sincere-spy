var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// WORD SETS IN data.js AS JSON
var words = require('./data.json');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
var allowCrossDomain = function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
}

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(function(req, res, next){
  res.io = io;
  next();
});
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(allowCrossDomain);

function assignroom() {
      newroom=Math.floor(Math.random()*9000) + 1000 //max number of simultaneous rooms = 9999
      if(newroom in rooms) {
          return assignroom()
      }
      return newroom
  }

//Seeding for the randomizer
!function(a,b){function c(c,j,k){var n=[];j=1==j?{entropy:!0}:j||{};var s=g(f(j.entropy?[c,i(a)]:null==c?h():c,3),n),t=new d(n),u=function(){for(var a=t.g(m),b=p,c=0;a<q;)a=(a+c)*l,b*=l,c=t.g(1);for(;a>=r;)a/=2,b/=2,c>>>=1;return(a+c)/b};return u.int32=function(){return 0|t.g(4)},u.quick=function(){return t.g(4)/4294967296},u.double=u,g(i(t.S),a),(j.pass||k||function(a,c,d,f){return f&&(f.S&&e(f,t),a.state=function(){return e(t,{})}),d?(b[o]=a,c):a})(u,s,"global"in j?j.global:this==b,j.state)}function d(a){var b,c=a.length,d=this,e=0,f=d.i=d.j=0,g=d.S=[];for(c||(a=[c++]);e<l;)g[e]=e++;for(e=0;e<l;e++)g[e]=g[f=s&f+a[e%c]+(b=g[e])],g[f]=b;(d.g=function(a){for(var b,c=0,e=d.i,f=d.j,g=d.S;a--;)b=g[e=s&e+1],c=c*l+g[s&(g[e]=g[f=s&f+b])+(g[f]=b)];return d.i=e,d.j=f,c})(l)}function e(a,b){return b.i=a.i,b.j=a.j,b.S=a.S.slice(),b}function f(a,b){var c,d=[],e=typeof a;if(b&&"object"==e)for(c in a)try{d.push(f(a[c],b-1))}catch(a){}return d.length?d:"string"==e?a:a+"\0"}function g(a,b){for(var c,d=a+"",e=0;e<d.length;)b[s&e]=s&(c^=19*b[s&e])+d.charCodeAt(e++);return i(b)}function h(){try{var b;return j&&(b=j.randomBytes)?b=b(l):(b=new Uint8Array(l),(k.crypto||k.msCrypto).getRandomValues(b)),i(b)}catch(b){var c=k.navigator,d=c&&c.plugins;return[+new Date,k,d,k.screen,i(a)]}}function i(a){return String.fromCharCode.apply(0,a)}var j,k=this,l=256,m=6,n=52,o="random",p=b.pow(l,m),q=b.pow(2,n),r=2*q,s=l-1;if(b["seed"+o]=c,g(b.random(),a),"object"==typeof module&&module.exports){module.exports=c;try{j=require("crypto")}catch(a){}}else"function"==typeof define&&define.amd&&define(function(){return c})}([],Math);

function assignCodenames(arr, size, seed) {
    Math.seedrandom(seed)
    var a= new Array(Math.floor(size/3)).fill("bg-teama")  //team a
    var b= new Array(Math.floor(size/3)).fill("bg-teamb")  //team b
    var n= new Array(Math.floor(size/3)-1).fill("bg-neutral")  //team neutral
    var d=['bg-dark'] //danger
    
    if(seed%2==0) {a.push('bg-teama')}//Team A goes first on even seeds
    else {b.push('bg-teamb')}//Team B goes first on odd seeds
    
    spy=getRandom(a.concat(b,n,d), size)
    wordset=getRandom(arr, size)
    
    Math.seedrandom() //reset to ARC4-based PRNG 
    
    return {'spy':spy,'words':wordset}
}
    
    
function getRandom(arr, size) {        
    
    var shuffled = arr.slice(0), i = arr.length, min = i - size, temp, index;
    while (i-- > min) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(min);
}

app.get('/', function(req, res, next) {
  res.sendfile('views/index.html');
});
app.post('/words', function(req, res, next) {
  console.log("recieved")
  console.log(req.body)
  console.log(req.body.n)
  console.log(req.body.set)
  var data=assignCodenames(words[req.body.set], req.body.n, req.body.seed)
  res.send(data);
});


io.on('connection', function(socket){ 
    
    socket.on('join', function(room){
        socket.join(String(room))
    });
    
    socket.on('select', function(s){
        io.to(s.room).emit('select', s)
    });
    
    socket.on('again', function(r){
        io.to(r[1]).emit('again', r[0])
    });
    
    
    
});
      
module.exports = {app: app, server: server};