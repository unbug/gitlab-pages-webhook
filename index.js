#!/usr/bin/env node
var http = require('http');
var Url = require('url');
var util = require('util');
var colors = require('colors');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var fs = require('fs');

//prevent node.js from crashing
process.on('uncaughtException', function (err) {
    console.log("process uncaughtException error");
    console.error(err);
});

var excuteArgvs = (function(){
    var p = process.argv[2] || 8163,
        g = process.argv[3]?process.argv[3].split(','):[];
    return {
        port: p,
        gitHosts: g
    }
})();

var HOST = '0.0.0.0';
var PORT = excuteArgvs.port;
var GIT_HOSTS = excuteArgvs.gitHosts || [];
/**
 * @param params={
 *     branch,
 *     tag,
 *     bower,
 *     grunt,
 *     gulp
 * }
 */
function webhookCallback(data, params) {
    console.log('*** gitlabhook ***');
    var repo = data.repository.git_http_url;
    var user_name = data.user_name;
    //fix gitlab 7.X+
    if (user_name == 'Administrator') {
        user_name = repo.match(/.*\/(.*)\/.*\.git/)[1];
    }

    //data
    if (data && user_name) {
        var path = '/home/';
        console.log('data : ');
        console.log(data);

        //user
        fs.exists(path + user_name, function (exists) {
            path += exists ? user_name : 'public';
            console.log('user path : ' + path);
            if (data.repository && data.repository.name) {
                var projectName = data.repository.name;//data.repository.name.toLowerCase();
                //repo
                var passrepo = false;
                for(var i = 0;i<GIT_HOSTS.length;i++){
                    var fh = GIT_HOSTS[i];
                    if(repo.indexOf(fh) ==0 ){
                        passrepo = true;
                    }
                }
                passrepo && fs.exists(path + '/' + projectName, function (exists) {
                    console.log('repo OK: ' + path);
                    //repp exit, git pull
                    var cmd = '';
                    if (exists) {
                        path += '/' + projectName;
                        console.log('git pull ' + path);
                        //checkout master then pull
                        cmd += 'git checkout master && git pull';
                    }
                    //repo not exit, git clone
                    else if (repo) {
                        console.log('git clone ' + path);
                        cmd = 'git clone ' + repo;
                        cmd += params.branch ? (' && cd ' + projectName) : '';
                    }
                    if (cmd) {
                        //checkout branch
                        cmd += params.branch ? (' && git checkout ' + params.branch + ' && git pull') : '';
                        //checkout tag
                        cmd += params.tag ? (' && git fetch --tags && git checkout ' + params.tag) : '';
                        //run bower
                        cmd += params.bower ? (' && bower ' + params.bower) : '';
                        //run grunt
                        cmd += params.grunt ? (' && grunt ' + params.grunt) : '';
                        //run gulp
                        cmd += params.gulp ? (' && gulp ' + params.gulp) : '';
                        exec(cmd, {cwd: path}, function (error, stdout, stderr) {
                            console.log('stdout: ' + stdout);
                            console.log('stderr: ' + stderr);
                            if (error !== null) {
                                console.log('exec error: ' + error);
                            } else {
                                console.log('Done!');
                            }
                        });
                    }
                });
            }
        });
    }
}
function reply(statusCode, res) {
    var headers = {
        'Content-Length': 0
    };
    res.writeHead(statusCode, headers);
    res.end();
}
function parse(data) {
    var result;
    try {
        result = JSON.parse(data);
    } catch (e) {
        result = false;
    }
    return result;
}
function serverHandler(req, res) {
    var url = Url.parse(req.url, true);
    var buffer = [];
    var bufferLength = 0;
    var failed = false;

    req.on('data', function (chunk) {
        if (failed) return;
        buffer.push(chunk);
        bufferLength += chunk.length;
    });

    req.on('end', function (chunk) {
        if (failed) return;
        var data;

        if (chunk) {
            buffer.push(chunk);
            bufferLength += chunk.length;
        }

        data = Buffer.concat(buffer, bufferLength).toString();
        data = parse(data);

        reply(200, res);

        webhookCallback(data, url.query);
    });

    // 405 if the method is wrong
    if (req.method !== 'POST') {
        failed = true;
        return reply(405, res);
    }
}
var webServer;
webServer = http.createServer(serverHandler);
webServer.listen(PORT, HOST, function () {
    util.log('==========gitlab-pages-webhook [listen port] [gitlab host,...]==========='.red.bold);
    util.log('==================================================================='.red.bold);
    util.log('             SERVER IS READY ON ' +(HOST).red.bold+' PORT '+(PORT+'              ').red.bold);
    util.log('==================================================================='.red.bold);
    util.log('==================================================================='.red.bold);
});