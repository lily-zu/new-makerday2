const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  name: String,
  // Add other device-related fields as needed
});

module.exports = mongoose.model('Device', deviceSchema);
