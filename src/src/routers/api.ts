import express from 'express';
import * as utils from '../utils';
import User from '../interfaces/user';

const router = express();

router.get('/', (req, res) => {
    res.json({hello: 'world'});
});

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
        return res.status(400).json({ error: '2fa' });
    else if(user.has2fa && !user.verifyTwoFactorCode(twoFactorCode!))
        return res.status(400).json({ error: 'ongeldige 2fa code' });

    const sessionToken = user.rollSessionToken();

    res.cookie('session', sessionToken).json({ token: sessionToken });
});

router.post('/auth/register', (req, res) : any => {
    const email = req.body.email,
        password = req.body.password;

    if(!email || !password)
        return res.status(400).json({ error: 'request error, missende velden' });

    if(!utils.verifyEmailRegex(email))
        return res.status(400).json({ error: 'email is in een incorrect formaat' });
    if(User.getUserByEmail(email))
        return res.status(400).json({ error: 'email is al gebruikt' });
    
    const user = User.createUser(email, password);

    res.status(204).json({});
});

export default router;