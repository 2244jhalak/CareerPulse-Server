const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

require('dotenv').config()

const app = express();
const port = process.env.PORT || 5000;


// middleware
const corsOptions={
    origin:['http://localhost:5173'],
    credentials:true,
    optionSuccessStatus:200
}

app.use(cors(corsOptions))
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tqysnnt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const jobsCollection = client.db("jobDB").collection('jobs');
    const appliedCollection = client.db("jobDB").collection('applied');
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