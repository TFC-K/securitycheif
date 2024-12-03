import express from 'express';
import database from '../database';
import User from '../interfaces/user';
import { UserFlags } from '../interfaces/interfaces';
import markdownit from 'markdown-it';
import Test from '../interfaces/test';

const router = express();

const md = markdownit({
    html: true,
    linkify: true,
    typographer: true
});

router.get('/register', (req, res) => {
    if(req.cookies.session)
        return res.redirect('/dashboard');
    res.render('register.ejs');
});

router.get('/login', (req, res) => {
    if(req.cookies.session)
        return res.redirect('/dashboard');
    res.render('login.ejs');
});

router.get('/', (req, res) => {
    res.render('index.ejs', {
        blogs: database.db.prepare('SELECT * FROM blog').all()
    });
});

router.get('/dashboard', (req, res) => {
    const user = User.getUserByToken(req.cookies.session);
    if(!user)
        return res.clearCookie('session').redirect('/login');
    if(!user.hasFlags(UserFlags.Verified))
        return res.render('noaccess.ejs');
    res.render('dashboard.ejs', { user, tests: database.db.prepare('SELECT * FROM tests WHERE requestee = ?').all(user.userId) });
});

router.get('/dashboard/request', (req, res) => {
    const user = User.getUserByToken(req.cookies.session);
    if(!user)
        return res.clearCookie('session').redirect('/login');
    if(!user.hasFlags(UserFlags.Verified))
        return res.render('noaccess.ejs');
    res.render('request.ejs');
});

router.get('/dashboard/admin', (req, res) => {
    const user = User.getUserByToken(req.cookies.session);
    if(!user)
        return res.clearCookie('session').redirect('/login');
    if(!user.hasFlags(UserFlags.Administrator))
        return res.redirect('/dashboard');

    const verifiedUsers = database.db.prepare(`SELECT * FROM users WHERE (flags & ${UserFlags.Verified}) == ${UserFlags.Verified}`).all();
    const websites = [];

    for(let user of verifiedUsers) {
        for(let website of <string[]>JSON.parse((<any>user)['websites']))
        {
            websites.push({ owner: (<any>user).id, website });
        }
    }

    res.render('admin.ejs', { user, websites });
});

router.get('/dashboard/sadmin', (req, res) => {
    const user = User.getUserByToken(req.cookies.session);
    if(!user)
        return res.clearCookie('session').redirect('/login');
    if(!user.hasFlags(UserFlags.SuperAdministrator))
        return res.redirect('/dashboard');
    res.render('sadmin.ejs', { user });
});

router.get('/blog/:blogId', (req, res) : any => {
    const blog: any = database.db.prepare('SELECT * FROM blog WHERE id=?').get(req.params.blogId);
    if(!blog)
        return res.status(404).send('404: blog not found, <a href="/">go back</a>');
    res.render('blog.ejs', { md: md.render(blog.content), blog: blog })
});

router.get('/feedback/:testId', (req, res) : any => {
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

    return res.render('feedbackform.ejs', { test: { id: test.testId, requestee: test.requestee, artifacts: test.artifacts, flags: test.flags, website: test['_website'] }, md });
});

router.get('/requests/:siteId', (req, res) : any => {
    if(!req.params.siteId)
        return res.status(400).json({ error: 'bad request' });
    const user = User.getUserByToken(req.cookies.session);
    if(!user)
        return res.status(401).json({ error: 'unauthorized' });
    if((!user.hasFlags(UserFlags.SuperAdministrator) || !user.hasFlags(UserFlags.Administrator)))
        return res.status(403).json({ error: 'unauthorized' });
    const tests = database.db.prepare('SELECT id FROM tests WHERE website=?').all(req.params.siteId).flatMap(x => (<any>x).id);
    return res.render('sitetests.ejs', { website: req.params.siteId, tests });
});

router.get('/dashboard/admin/edit/:reportId', (req, res) : any => {
    if(!req.params.reportId)
        return res.status(400).json({ error: 'bad request' });
    const user = User.getUserByToken(req.cookies.session);
    if(!user)
        return res.status(401).json({ error: 'unauthorized' });
    if((!user.hasFlags(UserFlags.SuperAdministrator) || !user.hasFlags(UserFlags.Administrator)))
        return res.status(403).json({ error: 'unauthorized' });
    const test = Test.getTestById(req.params.reportId);
    if(!test)
        return res.status(404).json({ error: 'not found' });

    return res.render('reportedit.ejs', { });
});

export default router;