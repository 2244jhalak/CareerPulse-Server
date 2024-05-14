const express = require('express');
const cors = require('cors');
const jwt=require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

require('dotenv').config()

const app = express();
const port = process.env.PORT || 5000;


// middleware
const corsOptions={
    origin:['http://localhost:5173','https://b9a11-client-side-2244jhalak.web.app','https://b9a11-client-side-2244jhalak.firebaseapp.com'],
    credentials:true,
    optionSuccessStatus:200
}

app.use(cors(corsOptions))
app.use(express.json());
app.use(cookieParser());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tqysnnt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
// middlewares
const logger=(req,res,next)=>{
  console.log('Log:info',req.method,req.url);
  next();

}
const verifyToken=(req,res,next)=>{
  const token=req?.cookies?.token;
  // console.log('token in the middleware',token);
  if(!token){
    return res.status(401).send({message:'unauthorized access'})
  }

  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
    
    if(err){
      return res.status(401).send({message:'unauthorized access'})
    }
    req.user=decoded;
    
    next();
  })
}
  // next();

async function run() {
  try {
    const jobsCollection = client.db("jobDB").collection('jobs');
    const appliedCollection = client.db("jobDB").collection('applied');
     // auth related api
     app.post('/jwt',logger,async(req,res)=>{
      const user=req.body;
      console.log('User for token',user);
      const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1d'});
      // res.send({token});
      res.cookie('token',token,{
        httpOnly:true,
        secure:true,
        sameSite:'none'
      })
      .send({success:true});
    })
    app.post('/logout',async(req,res)=>{
      const user=req.body;
      console.log('logging out',user);
      res.clearCookie('token',{maxAge:0}).send({success:true});
    })
    // Get all jobs data from db
    app.get('/jobs',async (req,res)=>{
         const result=await jobsCollection.find().toArray();
         res.send(result);
    })
    // Get applied data from db
    app.get('/applied',async (req,res)=>{
         const result=await appliedCollection.find().toArray();
         res.send(result);
    })
    // Get all jobs data from db
    app.get('/jobs',async (req,res)=>{
         const result=await jobsCollection.find().toArray();
         res.send(result);
    })

    // Get a single job data from db using job id
    app.get('/job/:id',async(req,res)=>{
      const id=req.params.id;
      const query={_id: new ObjectId(id)};
      const result=await jobsCollection.findOne(query);
      res.send(result);
    })
    
    // Get jobs data from db using job email
    app.get('/jobs/:email',logger,verifyToken,async(req,res)=>{
      if(req.user.email !== req.params.email){
        console.log(req.user.email,req.params.email);
        return res.status(403).send({message:'Forbidden access'})
        
      }
      let query={};
      if(req.params?.email){
          query={email:req.params?.email}
      }
      
      const cursor=jobsCollection.find(query);
      const result=await cursor.toArray();
      res.send(result);
    })
    // Get appliedJobs data from db using user email
    app.get('/applied/:email',logger,verifyToken,async(req,res)=>{
      if(req.user.email !== req.params.email){
        console.log(req.user.email,req.params.email);
        return res.status(403).send({message:'Forbidden access'})
        
      }
      let query={};
      if(req.params?.email){
          query={userEmail:req.params?.email}
      }
      
      const cursor=appliedCollection.find(query);
      const result=await cursor.toArray();
      res.send(result);
    })
    // Update applied number
    
    
    // Save an applied data in db
    app.post('/applied',async (req,res)=>{
      const appliedData=req.body;
      console.log(appliedData);
      const result=await appliedCollection.insertOne(appliedData);
      res.send(result);

    })
    // Add a job data in db
    app.post('/job',async (req,res)=>{
      const jobData=req.body;
      console.log(jobData);
      const result=await jobsCollection.insertOne(jobData);
      res.send(result);

    })
    // Delete a single job data from db using job id
    app.delete('/job/:id',async(req,res)=>{
      const id=req.params.id;
      const query={_id: new ObjectId(id)};
      const result=await jobsCollection.deleteOne(query);
      res.send(result);
    })
    // update a job in db
    app.put('/job/:id',async(req,res)=>{
      const id=req.params.id;
      const jobData=req.body;
      const query={_id:new ObjectId(id)};
      const options={upsert:true};
      const updateDoc={
        $set:{
          ...jobData,
        },
      }
      const result=await jobsCollection.updateOne(query,updateDoc,options);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    
  }
}
run().catch(console.dir);




app.get('/',(req,res)=>{
    res.send('Job server is running')
})

app.listen(port, () => {
    console.log(`Job Server is running on port : ${port}`)
})