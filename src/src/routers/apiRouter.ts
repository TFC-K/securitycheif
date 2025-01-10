import express from 'express';
import * as utils from '../utils';
import User from '../interfaces/user';
import Test from '../interfaces/test';
import { BlogFlags, TestFlags, UserFlags } from '../interfaces/interfaces';
import database from '../database';
import { v4 as uuidv4 } from 'uuid';

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

router.post('/user/tests', (req, res) : any => {
    const user = User.getUserByToken(req.cookies.session);
    if(!user)
        return res.status(401).json({ error: 'unauthorized' });
    if(!user.hasFlags(UserFlags.Verified))
        return res.status(403).json({ error: 'forbidden' });
    const { name, host, notes }: { host?: string, name?: string, notes?: string } = req.body;
    if(!name || !host || !notes)
        return res.status(400).json({ error: 'request error, missende velden' });
    const hostname = new URL(host).hostname;
    if(!hostname)
        return res.status(400).json({ error: 'request error, missende velden' });
    if(!user.websites.includes(hostname))
        user.websites = [...user.websites, hostname];

    const test = Test.createTest(user, hostname, notes);
    return res.status(200).json(test.testId);
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

router.put('/user/tests/:testId', (req, res) : any => {
    const artifacts = req.body;

    if(!req.params.testId || !artifacts || !Array.isArray(artifacts))
        return res.status(400).json({ error: 'bad request' });
    const user = User.getUserByToken(req.cookies.session);
    if(!user)
        return res.status(401).json({ error: 'unauthorized' });
    if(!user.hasFlags(UserFlags.Administrator))
        return res.status(403).json({error: 'forbidden'});
    const test = Test.getTestById(req.params.testId);
    if(!test)
        return res.status(404).json({ error: 'not found' });

    test.artifacts = artifacts;

    return res.status(204).end();
});

router.put('/user/tests/:testId/complete', (req, res) : any => {
    if(!req.params.testId)
        return res.status(400).json({ error: 'bad request' });
    const user = User.getUserByToken(req.cookies.session);
    if(!user)
        return res.status(401).json({ error: 'unauthorized' });
    if(!user.hasFlags(UserFlags.Administrator))
        return res.status(403).json({error: 'forbidden'});
    const test = Test.getTestById(req.params.testId);
    if(!test)
        return res.status(404).json({ error: 'not found' });

    test.flags = 2;

    return res.status(204).end();
});

router.get('/blogs', (req, res) : any => {
    const user = User.getUserByToken(req.cookies.session);
    if(!user)
        return res.status(401).json({ error: 'unauthorized' });
    if(!user.hasFlags(UserFlags.SuperAdministrator))
        return res.status(403).json({error: 'forbidden'});
    return res.status(200).json(database.db.prepare('SELECT * FROM blog WHERE (flags & 1<<0 == 1<<0)').all());
});

router.post('/blogs/:blogId', (req, res) : any => {
    const { author, title, content, published } : { author: string, title: string, content: string, published: boolean } = req.body;

    if(author === undefined || title === undefined || content === undefined || published === undefined)
        return res.status(400).json({ error: 'bad request' });

    const user = User.getUserByToken(req.cookies.session);
    if(!user)
        return res.status(401).json({ error: 'unauthorized' });
    if(!user.hasFlags(UserFlags.SuperAdministrator))
        return res.status(403).json({error: 'forbidden'});
    const blog: any = database.db.prepare('SELECT * FROM blog WHERE id=?').get(req.params.blogId);
    if(!blog)
        return res.status(404).json({error: 'not found'});
    let newFlags = 0;
    if(published)
        newFlags |= BlogFlags.Published;
    (database.db.prepare('UPDATE blog SET title=?, content=?, author=?, flags=? WHERE id=?').run(title, content, author, newFlags, req.params.blogId));
    return res.status(204).end();
});

router.delete('/blogs/:blogId', (req, res) : any => {
    const user = User.getUserByToken(req.cookies.session);
    if(!user)
        return res.status(401).json({ error: 'unauthorized' });
    if(!user.hasFlags(UserFlags.SuperAdministrator))
        return res.status(403).json({error: 'forbidden'});
    const blog: any = database.db.prepare('SELECT * FROM blog WHERE id=?').get(req.params.blogId);
    if(!blog)
        return res.status(404).json({error: 'not found'});
    database.db.prepare('DELETE FROM blog WHERE id=?').run(req.params.blogId)
    return res.status(204).end();
});

router.put('/blogs/:blogId/thumbnail', (req, res) : any => {
    if(!req.body.image)
        return res.status(400).json({ error: 'bad request' });

    const user = User.getUserByToken(req.cookies.session);
    if(!user)
        return res.status(401).json({ error: 'unauthorized' });
    if(!user.hasFlags(UserFlags.SuperAdministrator))
        return res.status(403).json({error: 'forbidden'});
    const blog: any = database.db.prepare('SELECT * FROM blog WHERE id=?').get(req.params.blogId);
    if(!blog)
        return res.status(404).json({error: 'not found'});
    (database.db.prepare('UPDATE blog SET thumbnail=? WHERE id=?').run(req.body.image, req.params.blogId));
    return res.status(204).end();
});

router.put('/blogs', (req, res) : any => {
    const user = User.getUserByToken(req.cookies.session);
    if(!user)
        return res.status(401).json({ error: 'unauthorized' });
    if(!user.hasFlags(UserFlags.SuperAdministrator))
        return res.status(403).json({error: 'forbidden'});

    const postId = uuidv4();

    database.db.prepare('INSERT INTO blog (id, title, created_at, author) VALUES (?, ?, ?, ?)').run(postId, 'nieuwe blog post', Date.now(), user.email);

    return res.status(200).json({post: postId});
});

export default router;