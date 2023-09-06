import express from 'express';
const router = express.Router();

router.get('/logout', (req, res) => {
  console.log("logging outtt");
  // @ts-ignore
  req.session.loggedin = false;
  // @ts-ignore
  req.session.username = false;
  res.redirect('/login');
});

export default router;