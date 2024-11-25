const mongoose = require('mongoose'); 

const connectDB = async () => { 
  try { 

    await mongoose.connect(process.env.MONGODB_URI, { 
     
      });    
       console.log('MongoDB connecté');   } catch (erreur) {     console.error(erreur.message);     process.exit(1);   } }; module.exports = connectDB;