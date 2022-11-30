
const isLogged = require('./middleware')

function handleRequest(app, db) {

	app.get('/', isLogged, (req, res) => {
		res.sendFile('/Users/ducanh/Documents/GitHub/hospital-management/public/patients-list.html')
	})

	app.get('/loginPage', (req, res) => {
		res.sendFile('/Users/ducanh/Documents/GitHub/hospital-management/public/log-in.html')
	})

	app.post('/loginCheck', (req, res) => {
        var formData = req.body
		if(formData.username == 'Manager' && formData.password == '22122001') {
			req.session.user = {username: 'Manager', password: '22122001',}
			req.session.save()
			res.redirect('/')
		}
		else { 
			res.redirect('/loginPage')
		}
	})

	app.get('/logout', (req, res) => {
		req.session.user = null
		req.session.save()
		res.redirect('/loginPage')
	})

	app.post('/addPatient', (req, res) => {
		var data = req.body
		var table

		if(data.type == 'in') table = 'INPATIENT'
		else table = 'OUTPATIENT'

		var sql = 
		`INSERT INTO 
		${table} (POSTFIX, FNAME, LNAME, GENDER, ADDRESS, PHONE) 
		VALUES ('${makeID(7)}', '${data.fname}', '${data.lname}', '${data.gender}', '${data.addr}', '${data.phone}')`
		
		db.query(sql, function (err, result) {
			if (err) throw err
			res.send('ok')
		})
	})

	app.post('/searchByDoctor', (req, res) => {
		var resMsg = []
		
		db.query(`SELECT FNAME, LNAME 
				FROM DOCTOR 
				WHERE DOCCODE = '${req.body.ip}'`,
				function (err, result) {
					if (err) throw err
					resMsg.push(result)

					db.query(`CALL search_inpatient_by_doc_id ('${req.body.ip}');`,
					(err, result) => {
						if (err) throw err
						resMsg.push(result)

						db.query(`CALL search_outpatient_by_doc_id ('${req.body.ip}');`,
						(err, result) => {
							if (err) throw err
							resMsg.push(result)

							console.log(resMsg)
							res.send(resMsg)
						})
					})
		})
	})

	app.post('/searchById', (req, res) => {
		var resMsg = []
		var pre = ''
		var post = ''
		for(var i = 0; i < 2; i++) pre+= req.body.id[i]
		for(var i = 2; i < 9; i++) post+= req.body.id[i]

		if(pre == 'IP'){
			db.query(`SELECT * FROM INPATIENT WHERE PREFIX='${pre}' AND POSTFIX='${post}';`, 
			function (err, result) {
				if (err) throw err
				resMsg.push(result)

				db.query(`SELECT COUNT(ID) AS NUM FROM (SELECT ID FROM (SELECT CONCAT(IPREFIX, IPOSTFIX) AS ID FROM TREATMENT) AS TEMP WHERE ID = '${req.body.id}') AS TEMP2;`,
				function(err, result) {
					if (err) throw err
					resMsg.push(result)
					res.send(resMsg)
				})
			})
		} else if(pre == 'OP'){
			db.query(`SELECT * FROM OUTPATIENT WHERE PREFIX='${pre}' AND POSTFIX='${post}';`, 
			function (err, result) {
				if (err) throw err
				resMsg.push(result)

				db.query(`SELECT COUNT(ID) AS NUM FROM (SELECT ID FROM (SELECT CONCAT(OPREFIX, OPOSTFIX) AS ID FROM EXAMINATION) AS TEMP WHERE ID = '${req.body.id}') AS TEMP2;`,
				function(err, result) {
					if (err) throw err
					resMsg.push(result)
					res.send(resMsg)
				})
			})
		}
		else {
			res.send(resMsg)
		}
	})

	app.post('/makeReport', (req, res) => {

		var resMsg = []
		var pre = ''
		var post = ''
		for(var i = 0; i < 2; i++) pre+= req.body.id[i]
		for(var i = 2; i < 9; i++) post+= req.body.id[i]

		if(pre == 'IP'){
			db.query(`SELECT CONCAT_WS(' ', FNAME, LNAME) AS NAME FROM INPATIENT WHERE PREFIX='IP' AND POSTFIX='${post}';`, 
			function (err, result) {
				if (err) throw err
				result[0].type = 'in'
				resMsg.push(result)
				if(result.length > 0){
					db.query(`CALL get_treatment_w_fee('IP', '${post}');`,
					function(err, result) {
						if (err) throw err
						resMsg.push(result)
						db.query(`CALL get_med_within_treatment('IP', '${post}');`, 
						function(err, result){
							if (err) throw err
							resMsg.push(result)
							res.send(resMsg)
						})
					})
				}
				else res.send([])
			})
		} 
		
		else if(pre == 'OP'){
			db.query(`SELECT CONCAT_WS(' ', FNAME, LNAME) AS NAME FROM OUTPATIENT WHERE PREFIX='OP' AND POSTFIX='${post}';`, 
			function (err, result) {
				if (err) throw err
				result[0].type = 'out'
				resMsg.push(result)
				if(result.length > 0){
					db.query(`CALL get_exam_w_fee('OP', '${post}');`,
					function(err, result) {
						if (err) throw err
						resMsg.push(result)
						db.query(`CALL get_med_within_exam('OP', '${post}');`, 
						function(err, result){
							if (err) throw err
							resMsg.push(result)
							res.send(resMsg)
						})
					})
				}
				else res.send([])
			})
		}

		else res.send([])
	})
}

function makeID(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

module.exports = handleRequest
