module.exports = function(app, passport, db, multer, ObjectId) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
      let userID = req.user._id
        db.collection('list').find({personPost: userID}).toArray((err, result) => {
          if (err) return console.log(err)
          res.render('profile.ejs', {
            user : req.user,
            messages: result
          })
        })
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// message board routes ===============================================================

    app.post('/list', (req, res) => {
      console.log("user id", req.user._id)
      db.collection('list').save({item: req.body.item, note: req.body.note, pic: req.body.pic, personPost: req.user._id}, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to list database')
        res.redirect('/profile')
           })
    })

    app.delete('/list', (req, res) => {
      db.collection('list').findOneAndDelete({item: req.body.item, note: req.body.note, personPost: req.user._id}, (err, result) => {
        if (err) return res.send(500, err)
        res.send('Message deleted!')
      })
    })

    //---------------------------------------
    // IMAGE CODE
    //---------------------------------------

    var storage = multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, 'public/images/uploads')
        },
        filename: (req, file, cb) => {
          cb(null, file.fieldname + '-' + Date.now() + ".png")
        }
    });
    var upload = multer({storage: storage});

    app.post('/up', upload.single('pic'), (req, res, next) => {
      // console.log(err)
      insertDocuments(db, req, 'images/uploads/' + req.file.filename, () => {
          //db.close();
          //res.json({'message': 'File uploaded successfully'});
      });
      
      res.redirect('/profile')
    });

    var insertDocuments = function(db, req, filePath, callback) {
      db.collection('list').save({item: req.body.item, note: req.body.note, pic: filePath, personPost: req.user._id}, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to list database')
      })
        // var collection = db.collection('users');
        // var uId = ObjectId(req.session.passport.user)
        // collection.findOneAndUpdate({"_id": uId}, {
          // $set: {
        //     profileImg: filePath
        //   }
        // }, {
        //   sort: {_id: -1},
        //   upsert: false
        // }, (err, result) => {
        //   if (err) return res.send(err)
        //   callback(result)
        // })
        // collection.findOne({"_id": uId}, (err, result) => {
        //     //{'imagePath' : filePath }
        //     //assert.equal(err, null);
        //     callback(result);
        // });
    }

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form

  app.get('/login', function(req, res) {
      res.render('login.ejs', { message: req.flash('loginMessage') });
  });

  // process the login form
  app.post('/login', passport.authenticate('local-login', {
      successRedirect : '/profile', // redirect to the secure profile section
      failureRedirect : '/login', // redirect back to the signup page if there is an error
      failureFlash : true // allow flash messages
  }));

  // SIGNUP =================================
  // show the signup form
  app.get('/signup', function(req, res) {
      res.render('signup.ejs', { message: req.flash('signupMessage') });
  });

  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
      successRedirect : '/profile', // redirect to the secure profile section
      failureRedirect : '/signup', // redirect back to the signup page if there is an error
      failureFlash : true // allow flash messages
  }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/');
}
