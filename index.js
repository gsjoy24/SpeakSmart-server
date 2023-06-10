const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middleware
const corsOptions = {
	origin: '*',
	credentials: true,
	optionSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nbdk5o7.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true
	}
});

app.listen(port, () => console.log('listening on port', port));
app.get('/', (req, res) => {
	res.send('server is running');
});

async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		await client.connect();
		const userCollection = client.db('speakSmart').collection('users');
		const classCollection = client.db('speakSmart').collection('classes');

		// generate JWT
		app.post('/jwt', async (req, res) => {
			const email = req.body;
			const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
			res.send({ token });
		});

		// save user information
		app.put('/users/:email', async (req, res) => {
			const email = req.params.email;
			const user = req.body;
			const query = { email };
			const options = { upsert: true };
			const updatedDoc = {
				$set: user
			};
			const result = await userCollection.updateOne(query, updatedDoc, options);
			res.send(result);
		});

		// get all users
		app.get('/users', async (req, res) => {
			const result = await userCollection.find().toArray();
			res.send(result);
		});

		// get all classes
		app.get('/popular-classes', async (req, res) => {
			const result = await classCollection.find().sort({ enrolledStudents: -1 }).limit(6).toArray();
			res.send(result);
		});

		// Send a ping to confirm a successful connection
		await client.db('admin').command({ ping: 1 });
		console.log('Pinged your deployment. You successfully connected to MongoDB!');
	} finally {
		// Ensures that the client will close when you finish/error
		// await client.close();
	}
}
run().catch(console.dir);
