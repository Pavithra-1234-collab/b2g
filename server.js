const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* ==============================
   ROOT TEST ROUTE
============================== */

app.get("/", (req, res) => {
  res.json({ message: "🚆 Smart Railway Backend Working Perfectly" });
});

/* ==============================
   CONNECT TO DATABASE
============================== */

mongoose.connect("mongodb://127.0.0.1:27017/smart-railway-mvp")
  .then(() => console.log("✅ MongoDB Connected - smart-railway-mvp"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

/* ==============================
   SEAT SCHEMA
============================== */

const seatSchema = new mongoose.Schema({
  trainId: String,
  coach: String,
  seatNumber: String,
  pnr: String,
  passengerName: String,
  boardingStation: String,
  verified: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["CONFIRMED", "EMPTY"],
    default: "CONFIRMED"
  },
  availableFromStation: { type: String, default: null }
}, { timestamps: true });

const Seat = mongoose.model("Seat", seatSchema);

/* ==============================
   ADD SEAT
============================== */

app.post("/api/add-seat", async (req, res) => {
  try {
    const seat = new Seat(req.body);
    await seat.save();
    res.status(201).json({ message: "Seat Added", seat });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

/* ==============================
   VERIFY SEAT
============================== */

app.post("/api/verify-seat", async (req, res) => {
  try {
    const { pnr } = req.body;
    const seat = await Seat.findOne({ pnr });

    if (!seat) {
      return res.status(404).json({ message: "Seat not found" });
    }

    seat.verified = true;
    await seat.save();

    res.json({ message: "Seat Verified", seat });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

/* ==============================
   MARK NO SHOW
============================== */

app.post("/api/mark-no-show/:trainId", async (req, res) => {
  try {
    const { nextStation } = req.body;
    const { trainId } = req.params;

    const result = await Seat.updateMany(
      {
        trainId,
        verified: false,
        status: "CONFIRMED"
      },
      {
        $set: {
          status: "EMPTY",
          availableFromStation: nextStation
        }
      }
    );

    res.json({
      message: "No-show seats converted",
      modifiedCount: result.modifiedCount
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

/* ==============================
   VIEW EMPTY SEATS
============================== */

app.get("/api/empty-seats/:trainId/:station", async (req, res) => {
  try {
    const { trainId, station } = req.params;

    const seats = await Seat.find({
      trainId,
      status: "EMPTY",
      availableFromStation: station
    });

    res.json({ seats });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

/* ==============================
   REBOOK SEAT
============================== */

app.post("/api/rebook-seat", async (req, res) => {
  try {
    const { seatId, newPassengerName, newPnr, boardingStation } = req.body;

    const seat = await Seat.findById(seatId);

    if (!seat || seat.status !== "EMPTY") {
      return res.status(400).json({ message: "Seat not available" });
    }

    seat.passengerName = newPassengerName;
    seat.pnr = newPnr;
    seat.boardingStation = boardingStation;
    seat.status = "CONFIRMED";
    seat.verified = false;
    seat.availableFromStation = null;

    await seat.save();

    res.json({ message: "Seat Rebooked", seat });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

/* ==============================
   START SERVER
============================== */

app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
