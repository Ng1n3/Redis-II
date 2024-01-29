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
  const photos = await getOrSetCache(`photos?albumId=${albumId}`, async () => {
    const { data } = await axios.get(
      "https://jsonplaceholder.typicode.com/photos",
      {
        params: { albumId },
      }
    );
    return data;
  });
  res.json(photos);
});

app.get("/photos/:id", async (req, res) => {
  console.log('Hit id');
  const photo = await getOrSetCache(`photos:${req.params.id}`, async () => {
    const { data } = await axios.get(
      `https://jsonplaceholder.typicode.com/photos/${req.params.id}`
    );
    return data;
  });
  res.json(photo);
});

function getOrSetCache(key, cb) {
  return new Promise((resolve, reject) => {
    client.get(key, async (err, data) => {
      if(err) return reject(err)
      if(data !== null) return resolve(JSON.parse(data))
      const freshData = await cb()
      client.setEx(key, DEFAULT_EXPIRATION, JSON.stringify(freshData))
      resolve(freshData)
    })
  })
}


app.listen(4000);
