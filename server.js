const express = require("express");
const axios = require("axios");
const cors = require("cors");
const redis = require("redis");

const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient({ legacyMode: true, PORT: REDIS_PORT });

client.connect().catch((err) => console.error(err));
const DEFAULT_EXPIRATION = 3600;

const app = express();
app.use(cors());

app.get("/photos", async (req, res) => {
  const albumId = req.query.albumId;
  client.get("photos", async (err, photos) => {
    if (err) console.log(err);
    if (photos !== null) return res.json(JSON.parse(photos));
    const { data } = await axios.get(
      "https://jsonplaceholder.typicode.com/photos",
      {
        params: { albumId },
      }
    );
    client.setEx("photos", DEFAULT_EXPIRATION, JSON.stringify(data));
    res.json(data);
  });
});

app.get("photos/:id", async (req, res) => {
  const { data } = await axios.get(
    `https://jsonplaceholder.typicode.com/photos/${req.params.id}`
  );
  res.json(data);
});

app.listen(4000);
