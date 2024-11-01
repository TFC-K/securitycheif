import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import apiRouter from './routers/apiRouter';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('./static'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use('/api', apiRouter);

app.get('/register', (req, res) => {
    res.render('register.ejs');
});

app.get('/login', (req, res) => {
    res.render('login.ejs');
});

app.get('/', (req, res) => {
    res.render('index.ejs');
});

export function listen(port: number) {
    app.listen(port);
}