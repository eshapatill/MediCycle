const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const path = require("path");

const Medicine = require("./models/Medicine");
const User = require("./models/User");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: "medicycle.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000
    }
  })
);

// ======================================
// AUTHENTICATION MIDDLEWARE
// ======================================

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin === true) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: "Please log in as admin first."
  });
}

function requireDonor(req, res, next) {
  if (
    req.session &&
    req.session.donorId &&
    req.session.role === "donor"
  ) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: "Please log in as a donor first."
  });
}

// ======================================
// DONOR REGISTRATION
// ======================================

app.post("/api/donor/register", async (req, res) => {
  try {
    const {
      fullName,
      email,
      mobile,
      city,
      password
    } = req.body;

    if (
      !fullName ||
      !email ||
      !mobile ||
      !city ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields."
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address."
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long."
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      mobile: String(mobile).trim(),
      city: String(city).trim(),
      password: hashedPassword
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful. You can now log in.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        city: user.city
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered."
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again."
    });
  }
});

// ======================================
// DONOR LOGIN
// ======================================

app.post("/api/donor/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email and password."
      });
    }

    const user = await User.findOne({
      email: String(email).trim().toLowerCase()
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    // Prevent session fixation.
    req.session.regenerate((error) => {
      if (error) {
        console.error("Session regeneration error:", error);

        return res.status(500).json({
          success: false,
          message: "Could not create login session."
        });
      }

      req.session.donorId = user._id.toString();
      req.session.role = "donor";
      req.session.isAdmin = false;

      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session save error:", saveError);

          return res.status(500).json({
            success: false,
            message: "Could not save login session."
          });
        }

        return res.json({
          success: true,
          message: "Login successful.",
          user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            city: user.city
          }
        });
      });
    });
  } catch (error) {
    console.error("Donor login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again."
    });
  }
});

// ======================================
// DONOR SESSION
// ======================================

app.get("/api/donor/session", async (req, res) => {
  try {
    if (
      !req.session ||
      !req.session.donorId ||
      req.session.role !== "donor"
    ) {
      return res.json({
        loggedIn: false
      });
    }

    const user = await User.findById(
      req.session.donorId
    ).select("fullName email city");

    if (!user) {
      return res.json({
        loggedIn: false
      });
    }

    return res.json({
      loggedIn: true,
      user
    });
  } catch (error) {
    console.error("Donor session error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not check login session."
    });
  }
});

// ======================================
// DONOR LOGOUT
// ======================================

app.post("/api/donor/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Donor logout error:", error);

      return res.status(500).json({
        success: false,
        message: "Logout failed."
      });
    }

    res.clearCookie("medicycle.sid");

    return res.json({
      success: true,
      message: "Logged out successfully."
    });
  });
});

// ======================================
// ADMIN LOGIN
// ======================================

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    return res.status(500).json({
      success: false,
      message: "Admin credentials are not configured in .env."
    });
  }

  if (
    username !== adminUsername ||
    password !== adminPassword
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid username or password."
    });
  }

  req.session.regenerate((error) => {
    if (error) {
      console.error("Admin session error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not create admin session."
      });
    }

    req.session.isAdmin = true;
    req.session.role = "admin";
    req.session.donorId = null;

    req.session.save((saveError) => {
      if (saveError) {
        console.error("Admin session save error:", saveError);

        return res.status(500).json({
          success: false,
          message: "Could not save admin session."
        });
      }

      return res.json({
        success: true,
        message: "Admin login successful."
      });
    });
  });
});

// ======================================
// ADMIN SESSION
// ======================================

app.get("/api/admin/session", (req, res) => {
  res.json({
    loggedIn: Boolean(req.session?.isAdmin)
  });
});

// ======================================
// ADMIN LOGOUT
// ======================================

app.post("/api/admin/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Admin logout error:", error);

      return res.status(500).json({
        success: false,
        message: "Logout failed."
      });
    }

    res.clearCookie("medicycle.sid");

    return res.json({
      success: true,
      message: "Admin logged out successfully."
    });
  });
});

// ======================================
// SUBMIT MEDICINE DONATION
// ======================================

app.post("/api/medicines", async (req, res) => {
  try {
    const {
      fullName,
      city,
      medicineName,
      quantity,
      expiryDate,
      packagingCondition,
      collectionReason
    } = req.body;

    if (
      !fullName ||
      !city ||
      !medicineName ||
      !quantity ||
      !expiryDate ||
      !packagingCondition ||
      !collectionReason
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields."
      });
    }

    const parsedExpiryDate = new Date(expiryDate);

    if (Number.isNaN(parsedExpiryDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid expiry date."
      });
    }

    // New donations must not be expired.
    if (parsedExpiryDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Expired medicines cannot be submitted."
      });
    }

    let donorId = null;
    let donorEmail = "";

    // Attach the donation to the logged-in donor, if applicable.
    if (
      req.session?.donorId &&
      req.session?.role === "donor"
    ) {
      const user = await User.findById(req.session.donorId);

      if (user) {
        donorId = user._id;
        donorEmail = user.email;
      }
    }

    const medicine = await Medicine.create({
      fullName: String(fullName).trim(),
      city: String(city).trim(),
      medicineName: String(medicineName).trim(),
      quantity: String(quantity).trim(),
      expiryDate: parsedExpiryDate,
      packagingCondition: String(packagingCondition).trim(),
      collectionReason: String(collectionReason).trim(),
      donorId,
      email: donorEmail
    });

    return res.status(201).json({
      success: true,
      message: "Medicine donation request submitted successfully.",
      medicine
    });
  } catch (error) {
    console.error("Medicine submission error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not submit medicine request."
    });
  }
});

// ======================================
// DONOR: MY DONATIONS
// ======================================

app.get(
  "/api/donor/donations",
  requireDonor,
  async (req, res) => {
    try {
      const medicines = await Medicine.find({
        donorId: req.session.donorId
      })
        .select(
          "medicineName quantity expiryDate packagingCondition city status createdAt"
        )
        .sort({ createdAt: -1 });

      return res.json({
        success: true,
        donations: medicines
      });
    } catch (error) {
      console.error("My donations error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not load your donations."
      });
    }
  }
);

// ======================================
// ADMIN: GET ALL DONATIONS
// ======================================

app.get("/api/medicines", requireAdmin, async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({
      createdAt: -1
    });

    return res.json(medicines);
  } catch (error) {
    console.error("Fetch medicines error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load medicine requests."
    });
  }
});

// ======================================
// ADMIN: UPDATE DONATION STATUS
// ======================================

app.patch(
  "/api/medicines/:id/status",
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const allowedStatuses = [
        "Pending",
        "Approved",
        "Rejected",
        "Completed"
      ];

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid medicine ID."
        });
      }

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status."
        });
      }

      const medicine = await Medicine.findByIdAndUpdate(
        id,
        { $set: { status } },
        {
          new: true,
          runValidators: true
        }
      );

      if (!medicine) {
        return res.status(404).json({
          success: false,
          message: "Medicine request not found."
        });
      }

      console.log(
        `Medicine "${medicine.medicineName}" status changed to ${medicine.status}`
      );

      return res.json({
        success: true,
        message: `Status updated to ${medicine.status}.`,
        medicine
      });
    } catch (error) {
      console.error("Status update error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to update medicine status."
      });
    }
  }
);

// ======================================
// SERVE PUBLIC FILES
// ======================================

app.use(express.static(path.join(__dirname, "public")));

// ======================================
// START SERVER
// ======================================

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from .env");
    }

    if (!process.env.SESSION_SECRET) {
      throw new Error("SESSION_SECRET is missing from .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(
        `MediCycle running at http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Server startup error:", error.message);
    process.exit(1);
  }
}

startServer();