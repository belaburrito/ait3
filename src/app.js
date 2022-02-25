/* app.js
const webby = require('./webby.js');
const app = new webby.App();

// add me some middlware!
app.use((req, res, next) => {
    console.log(req.method, req.path);
    next();
   });

// add a route
app.get('/hello', function(req, res) {
    // send back a response if route matches
    res.send('<h1>HELLO WORLD</h1>');
   });

app.listen(3000, '127.0.0.1');*/


const webby = require('./webby.js');
const path = require('path');
const app = new webby.App();



app.use(webby.static(path.join(__dirname,'..','public')));


//add a route

app.get('/', function(req, res) {
    res.send('<link rel="stylesheet" href="css/styles.css"><h1>Cows</h1><p><a href="/gallery.html">Gallery</a></p>');
});


app.get('/gallery.html', function(req, res) {
    //send back a response if route matches
    let rand = Math.floor(Math.random() * 4);
    const imgTemp = '<img src="img/animal';

    const style = '<link rel="stylesheet" href="css/styles.css">';
    let myCode = style;
    if(rand>0){
        myCode+='<h1>Here are ' + (rand+1) + ' cows!</h1>';
    }
    else{
        myCode+='<h1>Here is ' + (rand+1) + ' cow!</h1>';
    }

    while(rand>=0){
        const animalNum = Math.floor(Math.random() * 4) + 1;
        myCode+=imgTemp + animalNum +'.jpg">';
        rand--;
    }
    res.send(myCode);

});

app.get('/pics', function(req, res) {
    res.statusCode=301;
    res.set(301, 'Moved Permanently');
    res.set('Location', 'gallery');
});




app.listen(3000, '127.0.0.1');