import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import apiRouter from './routers/apiRouter';
import renderRouter from './routers/renderRouter';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('./static'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use('/api', apiRouter);
app.use(renderRouter);

export function listen(port: number) {
    app.listen(port);
}