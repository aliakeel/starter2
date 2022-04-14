const SHOPIFY_API_KEY="edf2fa3b505f33eb29127a00af8965f3";
const SHOPIFY_API_SECRET="bcfd9ead40d4a7a1ec5fdbac31e466ec";
const TUNNEL_URL="https://ee6c-148-251-29-53.ngrok.io";
const SCOPES = "read_customers";
const crypto = require('crypto');
const express = require('express');
const app = express();
const nonce = require('nonce')();
const request = require('request-promise');
const querystring = require('querystring');
const cookie = require('cookie');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const port = process.env.port || 3031;
// Parse incoming requests data (https://github.com/expressjs/body-parser)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
// const route = express.Router();

// app.use('/v1', route);

const transporter = nodemailer.createTransport({
    port: 465, // true for 465, false for other ports
    host: "smtp.gmail.com",
    auth: {
        user: 'abbamedix.mail@gmail.com',
        pass: 'AssA@1234',
    },
    secure: true,
});

app.get('/shopify', (req, res) => {
    const shopName = req.query.shop; // Shop Name passed in URL

    if (shopName) {
        const shopState = nonce();
        const redirectUri = TUNNEL_URL + '/shopify/callback'; // Redirect URI for shopify Callback
        const installUri = 'https://' + shopName +
            '/admin/oauth/authorize?client_id=' + SHOPIFY_API_KEY +
             '&scope=' + SCOPES +
            '&state=' + shopState +
            '&redirect_uri=' + redirectUri; // Install URL for app install
        console.log('/shopify '+installUri);
        res.cookie('state', shopState);
        res.redirect(installUri);
    } else {
        return res.status(400).send('Missing shop parameter. Please add ?shop=your-development-shop.myshopify.com to your request');
    }
});

app.get('/shopify/callback', (req, res) => {
    const {
        shopName,
        hmac,
        code,
        shopState
    } = req.query;
    const stateCookie = cookie.parse(req.headers.cookie).state;
    console.log(shopState + stateCookie);

    if (shopState !== stateCookie) {
        return res.status(403).send('Request origin cannot be verified');
    }

    if (shopName && hmac && code) {
        const map = Object.assign({}, req.query);
        delete map['signature'];
        delete map['hmac'];
        const message = querystring.stringify(map);
        const providedHmac = Buffer.from(hmac, 'utf-8');
        const generatedHash = Buffer.from(
            crypto
            .createHmac('sha256', SHOPIFY_API_SECRET)
            .update(message)
            .digest('hex'),
            'utf-8'
        );
        let hashEquals = false;

        try {
            hashEquals = crypto.timingSafeEqual(generatedHash, providedHmac)
        } catch (e) {
            hashEquals = false;
        };

        if (!hashEquals) {
            return res.status(400).send('HMAC validation failed');
        }
        const accessTokenRequestUrl = 'https://' + shopName + '/admin/oauth/access_token';
        const accessTokenPayload = {
            client_id: SHOPIFY_API_KEY,
            client_secret: SHOPIFY_API_SECRET,
            code,
        };
        request.post(accessTokenRequestUrl, {
                json: accessTokenPayload
            })
            .then((accessTokenResponse) => {
                const accessToken = accessTokenResponse.access_token;
                const shopRequestUrl = 'https://' + shopName + '/admin/api/2019-07/shop.json';
                const shopRequestHeaders = {
                    'X-Shopify-Access-Token': accessToken,
                };

                request.get(shopRequestUrl, {
                        headers: shopRequestHeaders
                    })
                    .then((shopResponse) => {
                        res.redirect('https://' + shopName + '/admin/apps');
                    })
                    .catch((error) => {
                        res.status(error.statusCode).send(error.error.error_description);
                    });
            })
            .catch((error) => {
                res.status(error.statusCode).send(error.error.error_description);
            });

    } else {
        res.status(400).send('Required parameters missing');
    }
});

app.get('/', (req, res) => {
    console.log('/ is requested!');
    res.send("hello");
});

app.post('/textmail', (req, res) => {
    const {to, subject, text} = req.body;
    const mailData = {
        from: 'abba.medix.mail@gmail.com',
        to: to,
        subject: subject,
        text: text,
        html: '<b>Hey there! </b><br> This is our first message sent with Nodemailer<br/>',
    };

    transporter.sendMail(mailData, (error, info) => {
        if (error) {
            return console.log(error);
        }
        res.status(200).send({
            message: "Mail send",
            message_id: info.messageId
        });
    });
});

// app.post('/', (req, res) => {
//     // res.send(req.body);
//     const {to, subject, text} = req.body;
//     const mailData = {
//         from: 'abba.medix.mail@gmail.com',
//         to: to,
//         subject: subject,
//         text: text,
//         html: '<b>Hey there! </b><br> This is our first message sent with Nodemailer<br/>',
//     };

//     transporter.sendMail(mailData, (error, info) => {
//         if (error) {
//             return console.log(error);
//         }
//         res.status(200).send({
//             message: "Mail send",
//             message_id: info.messageId
//         });
//     });
// });

const server = app.listen(port, () => {
    const port = server.address().port;
    console.log('Application  listening on port ${port}!');
});


// const express = require("express");
// const bodyParser = require('body-parser');
// const nodemailer = require('nodemailer');
// const app = express();
// // Parse incoming requests data (https://github.com/expressjs/body-parser)
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));
// const route = express.Router();

// const port = process.env.PORT || 3000;

// app.use('/v1', route);

// app.listen(port, () => {
//     console.log(`Server listening on port ${port}`);
// });


// const transporter = nodemailer.createTransport({
//     port: 465,
//     host: "smtp.gmail.com",
//     auth: {
//         user: 'youremail@gmail.com',
//         pass: 'xxxxxxxxxx',
//     },
//     secure: true, // upgrades later with STARTTLS -- change this based on the PORT
// });

// route.post('/textmail', (req, res) => {
//     const {to, subject, text } = req.body;
//     const mailData = {
//         from: 'youremail@gmail.com',
//         to: to,
//         subject: subject,
//         text: text,
//         html: '<b>Hey there! </b><br> This is our first message sent with Nodemailer<br/>',
//     };

//     transporter.sendMail(mailData, (error, info) => {
//         if (error) {
//             return console.log(error);
//         }
//         res.status(200).send({ message: "Mail send", message_id: info.messageId });
//     });
// });


// route.post('/attachments-mail', (req, res) => {
//     const {to, subject, text } = req.body;
//     const mailData = {
//         from: 'youremail@gmail.com',
//         to: to,
//         subject: subject,
//         text: text,
//         html: '<b>Hey there! </b><br> This is our first message sent with Nodemailer<br/>',
//         attachments: [
//             {   // file on disk as an attachment
//                 filename: 'nodemailer.png',
//                 path: 'nodemailer.png'
//             },
//             {   // file on disk as an attachment
//                 filename: 'text_file.txt',
//                 path: 'text_file.txt'
//             }
//         ]
//     };

//     transporter.sendMail(mailData, (error, info) => {
//         if (error) {
//             return console.log(error);
//         }
//         res.status(200).send({ message: "Mail send", message_id: info.messageId });
//     });
// });

