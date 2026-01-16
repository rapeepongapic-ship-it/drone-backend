// ================================
// 1. IMPORT & APP SETUP
// ================================
require("dotenv").config();
const { Redis } = require("@upstash/redis");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ================================
// 1.1 REDIS SETUP (Upstash)
// ================================
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// ================================
// 3. CALCULATION FUNCTION
// ================================
function calculateDroneFromTwoObservers(o1, o2) {
  // NOTE: ตอนนี้ใช้ midpoint (ทดสอบ logic ก่อน)
  return {
    lat: (o1.lat + o2.lat) / 2,
    lng: (o1.lng + o2.lng) / 2,
  };
}

// ================================
// 4. API ENDPOINT
// ================================
app.post("/calculate-drone", async (req, res) => {
  console.log("📡 HIT /calculate-drone");
  console.log("BODY =", req.body);

  try {
    const { sessionId, observer } = req.body;

    if (!sessionId || !observer) {
      return res.status(400).json({
        status: "error",
        message: "Missing sessionId or observer",
      });
    }

    const key = `session:${sessionId}`;

    // ✅ แก้จุดที่ 1: เก็บ observer เป็น object ตรง ๆ
    await redis.rpush(key, JSON.stringify(observer));


    const rawList = await redis.lrange(key, 0, -1);

    console.log("RAW FROM REDIS =", rawList);
    console.log("RAW TYPE =", rawList.map(v => typeof v));

    if (rawList.length < 2) {
      return res.json({
        status: "waiting",
        message: "Waiting for another observer",
      });
    }

    const observer1 = JSON.parse(rawList[0]);
    const observer2 = JSON.parse(rawList[1]);


    // ❗️ parse หลังจาก log เท่านั้น
    const o1 = JSON.parse(raw[0]);
    const o2 = JSON.parse(raw[1]);







    // ยังไม่ครบ 2 เครื่อง
    if (count < 2) {
      return res.status(200).json({
        status: "waiting",
        drone: null,
        message: "Waiting for another observer",
      });
    }

    // ครบ 2 เครื่อง → ดึง observer
    // const raw = await redis.lrange(key, 0, 1);
    // const o1 = JSON.parse(raw[0]);
    // const o2 = JSON.parse(raw[1]);

    const drone = calculateDroneFromTwoObservers(o1, o2);

    // ล้าง session
    await redis.del(key);

    return res.status(200).json({
      status: "calculated",
      drone,
    });
  } catch (err) {
    console.error("❌ ERROR", err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

// ================================
// 5. START SERVER
// ================================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
