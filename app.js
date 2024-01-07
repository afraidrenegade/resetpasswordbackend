// const axios = require("axios"); // Import 'axios' instead of 'request'
// const moment = require("moment");
// const apiRouter = require('./api');
// const cors = require("cors");
// const sendEmail = require("./sendEmail");
// const dotenv = require("dotenv").config();

// const port = 5000;
// const hostname = "localhost";
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(cors());
// app.use('/', apiRouter);
const express = require("express");
const app = express();
const http = require("http");
const bodyParser = require("body-parser");
const axios = require("axios");
const moment = require("moment");
const apiRouter = require("./api");
const cors = require("cors");
const mongoose = require("mongoose");
const crypto = require("crypto");
const sendEmail = require("./sendEmail"); // Assuming you have a sendEmail function defined

// Load environment variables
require("dotenv").config();

const port = 5000;
const hostname = "localhost";

// Connect to MongoDB
mongoose.connect(process.env.STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// Define a schema for reset tokens
const resetTokenSchema = new mongoose.Schema({
  email: String,
  token: String,
  expires_at: Date,
});

// Define a schema for users
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

// Create a model for reset tokens
const ResetToken = mongoose.model("ResetToken", resetTokenSchema);

// Create a model for users
const users = mongoose.model("users", userSchema);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use("/", apiRouter);
const server = http.createServer(app);


// ACCESS TOKEN FUNCTION - Updated to use 'axios'
async function getAccessToken() {
  const consumer_key = "ssKbKGwiYPHBmq6g5PfTdER7GNuqPySh"; // REPLACE IT WITH YOUR CONSUMER KEY
  const consumer_secret = "uUza2EdI5OMRQdPg"; // REPLACE IT WITH YOUR CONSUMER SECRET
  const url =
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

  const auth =
    "Basic " +
    new Buffer.from(consumer_key + ":" + consumer_secret).toString("base64");

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: auth,
      },
    });
    const accessToken = response.data.access_token;
    return accessToken;
  } catch (error) {
    throw error;
  }
}

app.get("/", (req, res) => {
  res.send("MPESA DARAJA API WITH NODE JS BY UMESKIA SOFTWARES");
  var timeStamp = moment().format("YYYYMMDDHHmmss");
  console.log(timeStamp);
});

//ACCESS TOKEN ROUTE
app.get("/access_token", (req, res) => {
  getAccessToken()
    .then((accessToken) => {
      res.send("😀 Your access token is " + accessToken);
    })
    .catch(console.log);
});

//MPESA STK PUSH ROUTE
app.get("/stkpush", (req, res) => {
  getAccessToken()
    .then((accessToken) => {
      const url =
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
      const auth = "Bearer " + 'B6DxGJpWyPHBxbuD0GHpeLdgPicr';
      const timestamp = moment().format("YYYYMMDDHHmmss");
      const password = new Buffer.from(
        "174379" +
          "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919" +
          timestamp
      ).toString("base64");

      axios
        .post(
          url,
          {
            BusinessShortCode: "174379",
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: "1",
            PartyA: "254794251657",
            PartyB: "174379",
            PhoneNumber: "254794251657",
            CallBackURL: "http://localhost:8080/",
            AccountReference: "UMESKIA PAY",
            TransactionDesc: "Mpesa Daraja API stk push test",
          },
          {
            headers: {
              Authorization: auth,
            },
          }
        )
        .then((response) => {
          res.send(
            "😀 Request is successful done ✔✔. Please enter mpesa pin to complete the transaction"
          );
        })
        .catch((error) => {
          console.log(error);
          res.status(500).send("❌ Request failed");
        });
    })
    .catch(console.log);
});

// REGISTER URL FOR C2B
app.get("/registerurl", (req, resp) => {
  getAccessToken()
    .then((accessToken) => {
      const url = "https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl";
      const auth = "Bearer " + accessToken;
      axios
        .post(
          url,
          {
            ShortCode: "174379",
            ResponseType: "Complete",
            ConfirmationURL: "http://example.com/confirmation",
            ValidationURL: "http://example.com/validation",
          },
          {
            headers: {
              Authorization: auth,
            },
          }
        )
        .then((response) => {
          resp.status(200).json(response.data);
        })
        .catch((error) => {
          console.log(error);
          resp.status(500).send("❌ Request failed");
        });
    })
    .catch(console.log);
});

app.get("/confirmation", (req, res) => {
  console.log("All transaction will be sent to this URL");
  console.log(req.body);
});

app.get("/validation", (req, resp) => {
  console.log("Validating payment");
  console.log(req.body);
});

// B2C ROUTE OR AUTO WITHDRAWAL
app.get("/b2curlrequest", (req, res) => {
  getAccessToken()
    .then((accessToken) => {
      const securityCredential =
        "N3Lx/hisedzPLxhDMDx80IcioaSO7eaFuMC52Uts4ixvQ/Fhg5LFVWJ3FhamKur/bmbFDHiUJ2KwqVeOlSClDK4nCbRIfrqJ+jQZsWqrXcMd0o3B2ehRIBxExNL9rqouKUKuYyKtTEEKggWPgg81oPhxQ8qTSDMROLoDhiVCKR6y77lnHZ0NU83KRU4xNPy0hRcGsITxzRWPz3Ag+qu/j7SVQ0s3FM5KqHdN2UnqJjX7c0rHhGZGsNuqqQFnoHrshp34ac/u/bWmrApUwL3sdP7rOrb0nWasP7wRSCP6mAmWAJ43qWeeocqrz68TlPDIlkPYAT5d9QlHJbHHKsa1NA==";
      const url = "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest";
      const auth = "Bearer " + accessToken;
      axios
        .post(
          url,
          {
            InitiatorName: "testapi",
            SecurityCredential: securityCredential,
            CommandID: "PromotionPayment",
            Amount: "1",
            PartyA: "600996",
            PartyB: "254768168060",
            Remarks: "Withdrawal",
            QueueTimeOutURL: "https://mydomain.com/b2c/queue",
            ResultURL: "https://mydomain.com/b2c/result",
            Occasion: "Withdrawal",
          },
          {
            headers: {
              Authorization: auth,
            },
          }
        )
        .then((response) => {
          res.status(200).json(response.data);
        })
        .catch((error) => {
          console.log(error);
          res.status(500).send("❌ Request failed");
        });
    })
    .catch(console.log);
});



// SEND RESET TOKEN
app.post("/sendresettoken", async (req, res) => {
  const { email } = req.body;
  const resetToken = crypto.randomBytes(20).toString("hex");
  const expirationTime = Date.now() + 3600000; // Token expires in 1 hour

  try {
    // Save resetToken, expirationTime, and user email in the MongoDB
    const newResetToken = new ResetToken({
      email,
      token: resetToken,
      expires_at: new Date(expirationTime),
    });
    

    // Sending the reset token via email
    const success = await sendEmail({
      subject: "Password reset Online courses",
      html: `<h3>Reset your password</h3><p>Here is your reset token:\n${resetToken}</p>`,
      to: email,
      from: process.env.GOOGLE_EMAIL,
    });

    if (success) {
      await newResetToken.save();
      return res.status(200).json({
        message: "Check your email for a reset token. Token expires in an hour", code: 200,
      });
    } else {
      return res.status(500).json({ error: "An internal server error occurred" });
    }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// RESET PASSWORD
app.post("/reset", async (req, res) => {
  const { token, password } = req.body;

  try {
    // Validate token and check expiration
    const resetInfo = await ResetToken.findOne({ token });

    if (!resetInfo) {
      return res.status(400).json({ error: "Invalid token" });
    }

    const expirationTime = resetInfo.expires_at.getTime();

    if (Date.now() > expirationTime) {
      return res.status(400).json({ error: "Token has expired" });
    }

    // Update user's password using the email from the reset token
    await users.updateOne({ email: resetInfo.email }, { password: password });

    // Delete the used reset token
    await ResetToken.deleteOne({ token });

    return res.status(200).json({ message: "Password reset successful", code: 200});
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
