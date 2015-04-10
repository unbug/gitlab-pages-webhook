Readme
=========
Github-pages is cool,but how about gitlab?This project helps you to set up a web hook server for your gitlab,so your can deoply your gitlab-pages,it's easier then your image,try it out.

Install
==========
```shell
npm install -g gitlab-pages-webhook
```

Web hook server configuration
================
## Start a web hook server
```shell
//gitlab-pages-webhook [listen port] [gitlab host,...]
gitlab-pages-webhook 8163 http://mygitlab.com,http://mygitlab2.com
```

## Set a nginx proxy to your web hook server,such as
```shell
server {
    listen 80;
    server_name  myserver.com;
    root /home;
    index index.html index.htm;

    error_page 405 =200 @405;
    location @405{
  	root /home;
	proxy_method GET;
    	proxy_pass http://static_backend;
    }
    access_log  off;
    error_log off;
    location / {
        # First attempt to serve request as file, then
        # as directory, then fall back to displaying a 404.
        try_files $uri $uri/ /index.html;
        # Uncomment to enable naxsi on this location
        #include /etc/nginx/naxsi.rules
        #autoindex on;
    }
    location ~* ^/.*/$ {
        #alias /usr/share/doc/;
        #autoindex on;
        #allow 127.0.0.1;
        #allow ::1;
        #deny all;
    }
    location /doc/ {
        alias /usr/share/doc/;
        autoindex on;
        allow 127.0.0.1;
        allow ::1;
        deny all;
    }
    location /deploy/ {
        proxy_pass http://127.0.0.1:8163;
    }
}
```

Web Hook Guide
===============

## Add your web hook server URL to your repo
YourPorject --> Settings --> Web Hooks --> URL values is Your web hook server RUL --> click "Add web Hook"。

### Make sure your repo is Publick
YourPorject --> Settings --> Edit Project --> select Public mode: Public access。

### deploy a branch(default is `master`) and a tag
The web hook server is `http://myserver.com/deploy/[?branch=branch1&tag=v1.0.0]`

eg. switch to `branch1`

```javascript
http://myserver.com/deploy/?branch=branch1
```

switch `branch1` and tag `v1.0.1`:

```javascript
http://myserver.com/deploy/?branch=branch1&tag=v1.0.1
```

### use bower|grunt|gulp task
```javascript
//run bower update task
http://myserver.com/deploy/?bower=update

//run grunt default task，task name is required!
http://myserver.com/deploy/?grunt=default

//run gulp default task，task name is required!
http://myserver.com/deploy/?gulp=default

//run bower update then run gulp default task
http://myserver.com/deploy/?bower=update&gulp=default
```
