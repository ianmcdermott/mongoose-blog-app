const mongoose = require('mongoose');

const blogpostSchema = mongoose.Schema({
	title: {type: String, required: true},
	content: {type: String, required: true},
	author: {
		firstName: {type: String, required: true},
		lastName: {type: String, required: true}
	}
	created: {type: Date, required: true}
})

blogpostSchema.virtual('authorName').get(function(){
	return `${this.name.firstName} ${this.name.lastName}`.trim()
});

blogpostSchema.methods.apiRepr = function(){
	return   {
		id: this._id, 
      	title: this.title,
      	content: this.content,
      	author: this.authorName,
      	created: this.created
  }	
}

const Blogpost = mongoose.model('Blogpost', blogpostSchema);

module.exports = {Blogpost};