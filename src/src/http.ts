import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import apiRouter from './routers/apiRouter';
import User from './interfaces/user';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('./static'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use('/api', apiRouter);

app.get('/register', (req, res) => {
    if(req.cookies.session)
        return res.redirect('/dashboard');
    res.render('register.ejs');
});

app.get('/login', (req, res) => {
    if(req.cookies.session)
        return res.redirect('/dashboard');
    res.render('login.ejs');
});

app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.get('/dashboard', (req, res) => {
    const user = User.getUserByToken(req.cookies.session);
    if(!user)
        return res.clearCookie('session').redirect('/login');
    res.render('dashboard.ejs', { user });
});

export function listen(port: number) {
    app.listen(port);
}