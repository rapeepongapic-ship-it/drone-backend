// // ================================
// // 1. IMPORT & APP SETUP
// // ================================
// require("dotenv").config();
// const { Redis } = require("@upstash/redis");
// const express = require("express");
// const cors = require("cors");

// const app = express();
// const PORT = 3000;

// app.use(cors());
// app.use(express.json());

// // ================================
// // 1.1 REDIS SETUP (Upstash)
// // ================================
// const redis = new Redis({
//   url: process.env.UPSTASH_REDIS_REST_URL,
//   token: process.env.UPSTASH_REDIS_REST_TOKEN,
// });

// // ================================
// // 3. CALCULATION FUNCTION
// // ================================
// function calculateDroneFromTwoObservers(o1, o2) {
//   // NOTE: ตอนนี้ใช้ midpoint (ทดสอบ logic ก่อน)
//   return {
//     lat: (o1.lat + o2.lat) / 2,
//     lng: (o1.lng + o2.lng) / 2,
//   };
// }

// // ================================
// // 4. API ENDPOINT
// // ================================
// app.post("/calculate-drone", async (req, res) => {
//   try {
//     console.log("BODY =", req.body);

//     const { sessionId, observer } = req.body;

//     // เช็ก input
//     if (!sessionId || !observer) {
//       return res.status(400).json({
//         status: "error",
//         message: "Missing sessionId or observer",
//       });
//     }

//     const key = `session:${sessionId}`;

//     // 🔴 จุดสำคัญที่สุด
//     // เก็บเข้า Redis = stringify เท่านั้น
//     await redis.rpush(key, JSON.stringify(observer));

//     // ดึงออกมา = จะได้ string ล้วน ๆ
//     const rawList = await redis.lrange(key, 0, -1);
//     console.log("RAW FROM REDIS =", rawList);

//     // ยังไม่ครบ 2 เครื่อง
//     if (rawList.length < 2) {
//       return res.json({
//         status: "waiting",
//         message: "Waiting for another observer",
//       });
//     }

//     // parse เฉพาะข้อมูลจาก Redis เท่านั้น
//     const o1 = JSON.parse(rawList[0]);
//     const o2 = JSON.parse(rawList[1]);

//     const drone = calculateDroneFromTwoObservers(o1, o2);

//     // ล้าง session
//     await redis.del(key);

//     return res.json({
//       status: "calculated",
//       drone,
//     });

//   } catch (err) {
//     console.error("❌ ERROR", err);
//     return res.status(500).json({
//       status: "error",
//       message: err.message,
//     });
//   }
// });

// // ================================
// // 5. START SERVER
// // ================================
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });


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
  return {
    lat: (o1.lat + o2.lat) / 2,
    lng: (o1.lng + o2.lng) / 2,
  };
}

// ================================
// 4. API ENDPOINT
// ================================
app.post("/calculate-drone", async (req, res) => {
  try {
    console.log("BODY =", req.body);

    const { sessionId, observer } = req.body;
    if (!sessionId || !observer) {
      return res.status(400).json({
        status: "error",
        message: "Missing sessionId or observer",
      });
    }

    const key = `session:${sessionId}`;

    // ✅ เก็บเป็น JSON string
    await redis.rpush(key, JSON.stringify(observer));

    // ✅ ดึงออกมา
    const rawList = await redis.lrange(key, 0, -1);
    console.log("RAW FROM REDIS =", rawList);

    // ✅ รอบแรก ต้องได้ waiting
    if (rawList.length < 2) {
      return res.json({
        status: "waiting",
        message: "Waiting for another observer",
      });
    }

    // ✅ สำคัญที่สุด ❗
    // ❌ ห้าม JSON.parse อีก
    const o1 = rawList[0];
    const o2 = rawList[1];

    // const o1 = JSON.parse(rawList[0])
    // const o2 = JSON.parse(rawList[1])

    const drone = calculateDroneFromTwoObservers(o1, o2);

    // ล้าง session
    await redis.del(key);

    return res.json({
      status: "calculated",
      drone,
    });

  } catch (err) {
    console.error("❌ ERROR", err);
    return res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});


// ================================
// 5. START SERVER
// ================================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

