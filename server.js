const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const {DATABASE_URL, PORT} = require('./config');
const {Blogpost} = require('./models');

const app = express();
app.use(bodyParser.json());

app.get('/blogposts', (req,res) =>{
	Blogpost
	  .find()
	  .limit(10)
	  .then(blogposts =>{
	  	res.json({
	  		blogposts: blogposts.map(
	  			(blogpost) => blogpost.apiRepr())
	  	});
	  })
	  .catch(
	  	err => {
	  		console.error(err);
	  		res.status(500).json({message: "Internal server error"});
	  	})
});


app.get('/blogposts/:id', (req, res) =>{
	Blogpost
 	  .findById(req.params.id)
	  .then(blogpost => res.json(blogpost.apiRepr()))
	  .catch(
		err => {
			console.error(err);
			//internal server error
			res.status(500).json({message: 'Internal server error'});
	});
});

app.post('/blogposts', (req, res) =>{
	const requiredFields = ['title', 'content', 'author'];
	for(let i = 0; i < requiredFields.length; i++){
		const field = requiredFields[i];
		if(!(field in req.body)){
			const message = `Missing \` ${field} \` in request body`;
			console.error(message);
			return res.status(400).send(message);
		}
	}

	Blogpost
		.create({
			title: req.body.title,
			content: req.body.content,
			author: req.body.author,
			created: req.body.created
		})
		.then(
			blogpost => res.status(201).json(blogpost.apiRepr()))
		.catch(err =>{
			console.log(err);
			res.status(500).json({message: "Internal server error"});
		});

});

app.put('/blogposts/:id', (req, res)=>{
	if(!(req.params.id === req.body.id)){
		const message = (`Request path id (${req.params.id} and request body id ` +
		`(${req.body.id}) must match`);
		console.error(message);
		res.status(400).status(message)
	}

	const toUpdate = {}
	const updateableFields = ['title', 'content', 'author'];

	updateableFields.forEach(field =>{
		if(field in req.body){
			toUpdate[field] = req.body[field];
		}
	});

	Blogpost
		.findByIdAndUpdate(req.params.id, {$set: toUpdate})
		.then(blogpost => res.status(204).end())
		.catch(err => res.status(500).json({message: 'Internal server error'}))
});

app.delete('/blogposts/:id', (req, res)=>{
	Blogpost
		.findByIdAndRemove(req.params.id)
		.then(blogpost => res.status(204).end())
		.catch(err => res.status(500).jeson({message: 'Internal server error'}));
});

app.use('*', (req, res) => {
	res.status(404).status({message:'Not Found'});
})

let server;

function runServer(databaseUrl = DATABASE_URL, port= PORT){
	return new Promise(resolve, reject) =>{
		mongoose.connect(databaseUrl, err =>{
			if(err){
				return reject(err);
			}
			server = app.listen(port, () =>{
				console.log(`Your app is listening on port ${port}`);
				resolve();
			}
			.on('error', err =>{
				mongoose.disconnect();
				reject(err);
			});
		});
	});
}

function closeServer(){
	return mongoose.disconnect().then(() =>{
		return new Promise((resolve, reject) =>
		console.log('Closing Server');
		server.close(err => {
			if(err) {
				return reject(err);
			}
				resolve();
			});
		});
	});
}

if(require.main === module){
	runServer().catch(err => console.error(err));
}

module.exports = {app, runServer, closeServer};
