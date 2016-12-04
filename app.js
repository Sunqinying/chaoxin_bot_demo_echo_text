const https = require('https');
const fs = require('fs');
const querystring = require('querystring');

const botConfig = {
    // 创建机器人时获取的 API key
    token: "253703:834f675e64b925513d754934afcd4a59",
    host: "botapi.chaoxin.com",
    method: '/sendTextMessage'
};

const serverOptions = {
    key: fs.readFileSync('./server.key'),
    cert: fs.readFileSync('./server.pem')
};


// 填写 url 后,下载对应的验证文件
const verifyFilePath = './verify-f921c05742cc093513023068a494.txt';


const server = https.createServer(serverOptions, ServerRequestListener);

server.listen(3000, function (err) {
    if (err) {
        return console.log(err);
    }
    console.log('Server start at port : ' + 3000);
});


function ServerRequestListener(req, res) {

    // node 是单线程的,防止单个用户信息错误导致服务器关闭
    try {

        var url = req.url;
        var method = req.method.toLocaleLowerCase();

        console.log('Received Request From ChaoXin : ' + url);

        // 收到服务器推送消息(用户消息 --> 超信服务器 --> bot服务器)
        if (method == 'post') {

            var message = '';
            req.addListener('data', function (chunk) {
                message += chunk;
            });
            req.addListener('end', function () {
                console.log('Received Message: ' + message);

                var messageObj = JSON.parse(message);

                if (messageObj.message_type == 0) {
                    handleEchoText(JSON.parse(message));
                }
                res.end();
            })
        }

        // 收到服务器验证请求
        if (method == 'get') {
            res.writeHead(200, {'Content-Type': 'application/octet-stream'});
            fs.createReadStream(verifyFilePath).pipe(res);
        }

    } catch (err) {
        console.log(err);
    }
}

function handleEchoText(message) {

    const echoData = querystring.stringify(
        {
            "chat_type": message.chat_type,
            "chat_id": message.chat_id,
            "text": message.text
        }
    );

    const options = {
        hostname: botConfig.host,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': echoData.length
        },
        method: 'POST',
        path: botConfig.method + '/' + botConfig.token
    };

    const req = https.request(options, function (res) {
        var sendResult = '';
        res.on('data', function (chunk) {
            sendResult += chunk;
        });
        res.on('end', function () {
            console.log('Send Result : ' + sendResult);
        })
    });
    req.on('error', function (err) {
        console.log(err);
    });
    req.write(echoData);
    req.end();
}

