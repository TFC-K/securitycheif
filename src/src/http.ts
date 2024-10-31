import express from 'express';
import bodyParser from 'body-parser';
import apiRouter from './routers/api';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('./static'));
app.use(bodyParser.json());
app.use('/api', apiRouter);


app.get('/', (req, res) => {
    res.render('index.ejs');
});

export function listen(port: number) {
    app.listen(port);
}