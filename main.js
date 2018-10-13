var express = require('express');
var app = express();
var fs = require("fs");
var base64 = require('base-64');
var utf8 = require('utf8');
var sha256 = require('sha256');
var bcrypt = require('bcrypt');
var text = 'foo © bar 𝌆 baz';
var user = require('./lib/user');
var randtoken = require('rand-token');
var config = require('./lib/config');
var redis = require('redis');
var client = redis.createClient(config.redis);
// Generate a 16 character alpha-numeric token:

//console.log(bcrypt.compareSync('UUSp+wnBRXT6r5eRZxW6K0+i8lpjiSDbnEx/AL8zQ1E=', '$2a$10$YbiFxLKbW2doTo/dzUK.9.Cjl4ZfodOyxJW.7AlcwLUpjZoYGpgZa'));
app.get('/login', function (req, res) {
    console.log(req.query);
    //capturar usuario y contraseña
    var login = req.query.login;
    var pass = req.query.password;
    if (login !== undefined && pass !== undefined) {
        // hashear la contraseña
        var passs = sha256(pass, {asString: true});
        //convertirla a base64
        var encoded = base64.encode(passs);
        //adquirir el usuario dsde mysl ...ir a users.json
        var u = user.getByLogin(login, function (u) {
            //chequearlo si existe
            if (u !== undefined) {
                //hay una diferencia entre el hash de php y de node... se cambia
                var hash = u.password.replace('$2y$', '$2a$');
                //se verifica las contraseñas hasheads y ocnvertidas a abase64 previamente
                var verify = bcrypt.compareSync(encoded, hash, 10);
                if (verify) {
                    //genera un codigo alfanumerico aleatorio de 16 caracteres
                    var token = randtoken.generate(16);
                    //responde con la session
                    res.end(JSON.stringify({status: 202, sessionid: token}));
                    client.on("error", function (err) {
                        console.log("Error " + err);
                    });
                    //guarda la session en redis por 300 segundos
                    client.set(token, JSON.stringify(u),'EX',300);
                } else {
                    res.end(JSON.stringify({status: 404, "error": "bad credentials"}));
                }
            } else {
                res.end(JSON.stringify({status: 404, "error": "user not found"}));
            }
        });
    } else {
        res.end(JSON.stringify({status: 404, "error": "wrong params"}));
    }
    // fs.readFile( __dirname + "/" + "users.json", 'utf8', function (err, data) {
    // console.log( data );

    // });
});

var server = app.listen(8081, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log("RAO session server app listening at http://%s:%s", host, port);

});

