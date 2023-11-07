const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.port || 5001;
require("dotenv").config();

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.esabfel.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// middlewares

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status.send(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    const roomsCollection = client.db("galaxyDB").collection("rooms");
    const bookingCollection = client.db("galaxyDB").collection("booking");
    const reviewCollection = client.db("galaxyDB").collection("review");
    // await client.connect();

    // auth related API

    app.post("/jwt", (req, res) => {
      const user = req.body;
      console.log(user);

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });

    // Rooms API

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
      const query = { _id: new ObjectId(id) };
      const result = await roomsCollection.findOne(query);
      res.send(result);
    });

    // Bookings API
    // app.get("/booking", async (req, res) => {
    //   try {
    //     const cursor = bookingCollection.find();
    //     const result = await cursor.toArray();
    //     res.send(result);
    //   } catch (err) {
    //     console.log(err);
    //   }
    // });

    app.get("/booking", verifyToken, async (req, res) => {
      if (req.user?.email !== req.query.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      console.log(query);
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: id };
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

    // app.post("/booking", async (req, res) => {
    //   const { img, available, checkIn, checkOut, _id } = req.body;
    //   const intBook = parseInt(available);
    //   if (intBook > 0) {
    //     const updateRoomNumber = intBook - 1;
    //     const result = await bookingCollection.insertOne({
    //       img,
    //       available: updateRoomNumber,
    //       checkIn,
    //       checkOut,
    //     });
    //     const updateRoom = await roomsCollection.updateOne(
    //       {id: _id},
    //       {$inc: { intBook: -1 },
    //     });
    //     res.send(result);
    //     res.send(updateRoom);
    //     console.log("booking successfull");
    //   } else {
    //     console.log("unsuccessfull");
    //   }
    // });

    app.put("/booking/:id", async (req, res) => {
      const newDate = req.body;
      const id = req.params.id;
      const filter = { _id: id };
      const options = { upsert: true };
      const updateDate = {
        $set: {
          checkIn: newDate.checkIn,
          checkOut: newDate.checkOut,
        },
      };
      const result = await bookingCollection.updateOne(
        filter,
        updateDate,
        options
      );
      res.send(result);
    });

    app.delete("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: id };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    // Reveiws API

    app.post("/review", async (req, res) => {
      const review = req.body;
      console.log(review);
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    app.get("/review", async (req, res) => {
      let query = {};
      if (req.query.sid) {
        query = { sid: req.query.sid };
      }
      const cursor = reviewCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/review/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reviewCollection.findOne(query);
      res.send(result);
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
  res.send("Galaxy Server is running perfect!");
});

app.listen(port, () => {
  console.log(`hello from ${port}`);
});
