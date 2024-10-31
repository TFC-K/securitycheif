import express from 'express';

const router = express();

router.get('/', (req, res) => {
    res.json({hello: 'world'});
});

export default router;