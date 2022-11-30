
function isLogged(req, res, next) {
    if(req.session.user){
        next()
    }
    else{
        res.redirect('/loginPage')
    }
}

module.exports = isLogged