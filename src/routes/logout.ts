import express from 'express';
const router = express.Router();

router.get('/logout', (req, res) => {

  req.session.destroy((err) => {
    if (err) {
      res.status(500).send('Error clearing session');
    } else {
      res.clearCookie('connect.sid');
      res.redirect('/login');
    }
  });

});

export default router;