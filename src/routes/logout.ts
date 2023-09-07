import express from 'express';
const router = express.Router();

router.get('/logout', (req, res) => {
  const username = req.session.username;

  req.session.destroy((err) => {
    if (err) {
      res.status(500).send('Error clearing session');
    } else {
      console.log(`User ${username} has logged out.`);
      res.clearCookie('connect.sid');
      res.redirect('/login');
    }
  });
});

export default router;