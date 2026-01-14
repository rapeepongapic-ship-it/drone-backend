const express = require('express')
const bodyParser = require('body-parser')
const app = express()

app.use(bodyParser.json())

const PORT = 3000

// ============================
// session storage (ของเดิม)
// ============================
const sessions = {}

// ============================
// API
// ============================
app.post('/calculate-drone', (req, res) => {

  /**
   * =====================================================
   * ✅ NEW: รองรับ Android (observer1 + observer2 มาพร้อมกัน)
   * =====================================================
   */
  if (req.body.observer1 && req.body.observer2) {
    const o1 = req.body.observer1
    const o2 = req.body.observer2

    // validate angle opposite
    const angleDiff = Math.abs(
      ((o1.degree - o2.degree + 540) % 360) - 180
    )

    if (angleDiff < 1) {
      return res.status(400).json({
        error: 'Bearings are opposite (180°)'
      })
    }

    const result = intersectLines(
      { lat: o1.lat, lng: o1.lng },
      o1.degree,
      { lat: o2.lat, lng: o2.lng },
      o2.degree
    )

    if (!result) {
      return res.status(400).json({
        error: 'Bearings are parallel or do not intersect'
      })
    }

    return res.json({
      status: 'calculated',
      drone: result
    })
  }

  /**
   * =====================================================
   * ⬇️ LOGIC เดิม (session-based) ❌ ไม่ลบ ❌ ไม่แก้
   * =====================================================
   */
  const { sessionId, observer } = req.body

  if (!sessionId || !observer) {
    return res.status(400).json({
      error: 'Missing sessionId or observer'
    })
  }

  if (!sessions[sessionId]) {
    sessions[sessionId] = []
  }

  sessions[sessionId].push(observer)

  if (sessions[sessionId].length < 2) {
    return res.json({
      status: 'waiting',
      message: 'Waiting for another observer'
    })
  }

  const [o1, o2] = sessions[sessionId]

  // validate มุมตรงข้าม
  const angleDiff = Math.abs(
    ((o1.degree - o2.degree + 540) % 360) - 180
  )

  if (angleDiff < 1) {
    delete sessions[sessionId]
    return res.status(400).json({
      error: 'Bearings are opposite (180°)'
    })
  }

  const result = intersectLines(
    { lat: o1.lat, lng: o1.lng },
    o1.degree,
    { lat: o2.lat, lng: o2.lng },
    o2.degree
  )

  delete sessions[sessionId]

  if (!result) {
    return res.status(400).json({
      error: 'Bearings are parallel or do not intersect'
    })
  }

  res.json({
    status: 'calculated',
    drone: result
  })
})

// ============================
// Geometry core (ของเดิม)
// ============================
function intersectLines(p1, bearing1, p2, bearing2) {
  const toRad = deg => deg * Math.PI / 180

  const θ1 = toRad(bearing1)
  const θ2 = toRad(bearing2)

  const x1 = p1.lng
  const y1 = p1.lat
  const x2 = p2.lng
  const y2 = p2.lat

  const dx1 = Math.sin(θ1)
  const dy1 = Math.cos(θ1)
  const dx2 = Math.sin(θ2)
  const dy2 = Math.cos(θ2)

  const det = dx1 * dy2 - dy1 * dx2
  if (Math.abs(det) < 1e-6) return null

  const t = ((x2 - x1) * dy2 - (y2 - y1) * dx2) / det

  return {
    lat: y1 + t * dy1,
    lng: x1 + t * dx1
  }
}

// ============================
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
