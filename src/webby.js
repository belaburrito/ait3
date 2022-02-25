// webby.js
const fs = require('fs');
const net = require('net');
const path = require('path');

const HTTP_STATUS_CODES = {
    200: 'OK',
    404: 'Not Found',    
    301: 'Moved Permanently',
    500: 'Internal Server Error'
};

const MIME_TYPES = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    html: 'text/html',
    css: 'text/css',
    txt: 'text/plain'
};

function getExtension(fileName){
    if (fileName.includes('.')===false){
        return '';
    }
    const words = fileName.split('.');
    return words[words.length-1].toLowerCase();
}

function getMIMEType(fileName){
    const ext = getExtension(fileName);
    if (MIME_TYPES[ext]===undefined){
        return '';
    }
    return MIME_TYPES[ext];
}

class Request{
    constructor(httpRequest){
        this.path = httpRequest.split(' ')[1];
        this.method = httpRequest.split(' ')[0];
    }
}

class Response{
    constructor(socket, statusCode=200, version='HTTP/1.1'){
        this.version = version;
        this.statusCode = statusCode;
        this.sock = socket;
        this.body='';
        this.headers = {};
    }

    set(name, value){
        this.headers[name] = value;
    }

    end(){
        this.sock.end();
    }

    statusLineToString(){
        return this.version + ' ' + this.statusCode + ' ' + HTTP_STATUS_CODES[this.statusCode] + '\r\n';
    }

    headersToString(){
        let res='';
        for (const [key, value] of Object.entries(this.headers)) {
            res+= key+': '+value+'\r\n';
        }
        return res;
    }

    send(body){
        this.body=body;
        if(!('Content-Type' in this.headers)){
            this.headers['Content-Type']='text/html';

        }

        let s = 'HTTP/1.1 '+ this.statusCode + ' ' + HTTP_STATUS_CODES[this.statusCode] + ' \r\n';

        const arrOfHeaderParts = Object.entries(this.headers);
        const headersArr = arrOfHeaderParts.map(function(parts) {
            const [name, val] = parts;
            return `${name}: ${val}`;
          });
          
        const headers = headersArr.join('\r\n');

        s+=headers+'\r\n\r\n';
        this.sock.write(s);
        this.sock.write(body);
        this.sock.end();
    }

    status(statusCode){
        this.statusCode = statusCode;
        return this;
    }
}

function serveStatic(basePath) {
    function myMid (req, res, next) {
    
        // OPTIONAL: immediatelly call next if `..` is in path
        // to prevent the reading of files outside of repo
        
        // OPTIONAL: handle `/` by translating that to index.html
        
        // TODO: retrieve the filename from the request object as fn
        // try to read the file
        const filePath = path.join(basePath, req.path);
        if(filePath.includes('..')){
            next(req, res);
        }
        else{
            if(filePath === '/'){
                req.path += 'index.html';
            }
            const fn=filePath;
            fs.readFile(fn, (err, data) => {
                if(err) { 
                    // TODO: go on to the route handlers by calling the next
                    next();
                } else {
                    res.set("Content-Type", getMIMEType(filePath));               
                    res.send(data);
                }
                });

        }
        
  
    }
    return myMid;
    // TODO: return your newly created middleware function
  
}


class App{
    constructor(){
        this.server = net.createServer(this.handleConnection.bind(this));
        this.routes={};
        this.middleware=null;
    }

    normalizePath(path){
        let pathSplit='';
        pathSplit = path.toLowerCase().split('/').filter(n=>n);
        let last=pathSplit[0];

        if(last===undefined){
            return '/';
        }

        if (last.includes('#')){
            pathSplit = last.split('#').filter(n=>n);
        }

        if (last.includes('?')){
            pathSplit = last.split('?').filter(n=>n);
        }

        last = '/'+pathSplit[0];
        return last;
    }

    createRouteKey(method, path){
        const s = method.toUpperCase() + ' ' + this.normalizePath(path);
        return s;
    }

    get(path, cb){
        const key = this.normalizePath(path);
        this.routes['GET '+key] = cb;
    }

    use(cb){
        this.middleware = cb;
    }

    listen(port, host){
        this.server.listen(port, host);
    }

    handleConnection(sock){
        console.log('connected');
        sock.on('data', data => this.handleRequest(sock,data));
    }

    handleRequest(sock, binaryData){
        const req = new Request(binaryData + '');
        const res = new Response(sock);

        if (this.middleware!==null){
            this.middleware(req, res, () => this.processRoutes(req,res));
        }
        else{
            this.processRoutes(req,res);
        }
    }

    processRoutes(req, res){
        const path = this.createRouteKey(req.method, req.path);

        if(this.routes[path]!==undefined) {
            this.routes[path](req, res);
        } else {
            res.statusCode = 404;
            res.set('Content-Type', 'text/plain');
            res.send('Page not found.');
        }
        //res.sock.end();
    }
}

  

module.exports={
    HTTP_STATUS_CODES: HTTP_STATUS_CODES,
    MIME_TYPES: MIME_TYPES,
    getExtension: getExtension,
    getMIMEType: getMIMEType,
    Request: Request,
    App: App,
    Response: Response,
    static: serveStatic
};