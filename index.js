const express = require('express');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const { rateLimit } = require('express-rate-limit');
const axios = require('axios');

const app = express();

app.use(morgan('combined'));


const limiter = rateLimit({
	windowMs: 2 * 60 * 1000, // 15 minutes
	limit: 5, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	// standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
	// legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	// store: ... , // Redis, Memcached, etc. See below.
})
app.use(limiter)

app.use('/bookingservice', async (req, res,next) => {
    console.log(req.headers['x-access-token']);
    try {
        const response = await axios.get('http://localhost:3001/api/v1/isAuthenticated', {
            headers: {
                'x-access-token': req.headers['x-access-token']
            }
        });

        console.log(response.data);
        if (response.data.success) {
            next();
        } else {
            return res.status(401).json({
                message:'Unauthorised'
            })
        }
    } catch (error) {
        return res.status(401).json({
            message:'Unauthorised'
        })
    }
    
})

app.use('/bookingservice', createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).send('Proxy error');
    }
}));
app.get('/api', (req, res) => {
    return res.status(200).send({
        messsage:"OK"
    })
})

app.listen(3005, () => {
    console.log("App running on port 3005")
});
