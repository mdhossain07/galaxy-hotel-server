const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.port || 5001;
require("dotenv").config();

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.esabfel.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const roomsCollection = client.db("galaxyDB").collection("rooms");
    const bookingCollection = client.db("galaxyDB").collection("booking");

    await client.connect();

    app.get("/rooms", async (req, res) => {
      try {
        // console.log(typeof req.query.sort);
        const sort = parseInt(req.query.sort);
        const result = await roomsCollection
          .find()
          .sort({ price: sort })
          .toArray();
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    app.get("/rooms/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      console.log(query);
      const result = await roomsCollection.findOne(query);
      res.send(result);
    });

    app.get("/booking", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.findOne(query);
      res.send(result);
    });

    app.post("/booking", async (req, res) => {
      try {
        const bookingInfo = req.body;
        console.log(bookingInfo);
        const result = await bookingCollection.insertOne(bookingInfo);
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Galaxy Server is running perfect");
});

app.listen(port, () => {
  console.log(`hello from ${port}`);
});
