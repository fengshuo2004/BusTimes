// Set these to whichever unoccupied port you'd like to use
const httpServerPort = 8080;
const corsProxyPort = 8081;

let corsProxy = require('cors-anywhere');
let httpServer = require("http-server");

function logger(req, res, error) {
    var date = new Date();
    var ip = '';
    if (error) {
        console.log(
            '[%s] %s "%s %s" Error (%s): "%s"',
            date, ip, req.method, req.url,
            error.status.toString(), error.message
        );
    }
    else {
        console.log(
            '[%s] %s "%s %s" "%s"',
            date, ip, req.method, req.url,
            req.headers['user-agent']
        );
    }
}

let options = {
    "proxy": "http://localhost:" + corsProxyPort,
    "cache": -1,
    "logFn": logger
};

corsProxy.createServer().listen(corsProxyPort);
httpServer.createServer(options).listen(httpServerPort, () => {
    console.log(`Server started. Visit http://localhost:${httpServerPort}/ to access web interface.`);
});