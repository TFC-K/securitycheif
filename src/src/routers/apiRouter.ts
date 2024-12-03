import express from 'express';
import * as utils from '../utils';
import User from '../interfaces/user';
import Test from '../interfaces/test';
import { UserFlags } from '../interfaces/interfaces';
import database from '../database';

const router = express();

router.post('/auth/login', (req, res) : any => {
    const email = req.body.email,
    password = req.body.password;

    if(!email || !password)
        return res.status(400).json({ error: 'request error, missende velden' });

    const twoFactorCode: string | undefined = req.body.totp;

    const user = User.getUserByEmail(email);
    if(!user || !user.verifyPassword(password))
        return res.status(401).json({ error: 'account bestaat niet, of wachtwoord is ongeldig' });
    
    if(user.has2fa && !twoFactorCode)
        return res.status(403).json({ error: '2fa verificatie nodig' });
    else if(user.has2fa && !user.verifyTwoFactorCode(twoFactorCode!))
        return res.status(400).json({ error: 'ongeldige 2fa code' });

    const sessionToken = user.rollSessionToken();

    res.status(204).cookie('session', sessionToken).end();
});

router.post('/auth/register', (req, res) : any => {
    const email = req.body.email,
        password = req.body.password,
        company = req.body.company;

    if(!email || !password)
        return res.status(400).json({ error: 'request error, missende velden' });

    if(!utils.verifyEmailRegex(email))
        return res.status(400).json({ error: 'email is in een incorrect formaat' });
    if(User.getUserByEmail(email))
        return res.status(400).json({ error: 'email is al in gebruik' });
    
    const user = User.createUser(email, password);
    user.websites = [new URL(company).hostname];
    
    res.status(204).json({});
});

router.get('/user/tests/:testId', (req, res) : any => {
    if(!req.params.testId)
        return res.status(400).json({ error: 'bad request' });
    const user = User.getUserByToken(req.cookies.session);
    if(!user)
        return res.status(401).json({ error: 'unauthorized' });
    const test = Test.getTestById(req.params.testId);
    if(!test)
        return res.status(404).json({ error: 'not found' });
    if((test.requestee.userId !== user.userId && (!user.hasFlags(UserFlags.SuperAdministrator) || !user.hasFlags(UserFlags.Administrator))))
        return res.status(403).json({ error: 'unauthorized' });

    return res.json({
        artifacts: test.artifacts,
    });
});

router.get('/user/tests', (req, res) : any => {
    const user = User.getUserByToken(req.cookies.session);
    if(!user)
        return res.status(401).json({ error: 'unauthorized' });
    const tests = database.db.prepare('SELECT id, flags, website FROM tests WHERE requestee=?').all(user.userId);
    return res.json(tests);
});

export default router;