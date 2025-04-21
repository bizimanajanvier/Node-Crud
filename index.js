console.log("Welcome Janvier to the Node.js application");

const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mysql = require("mysql2");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const SECRET_KEY = "mysecretkey"; // Change this to something strong in real applications

// DATABASE CONNECTION
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "StageNode1!",
    database: "Product"
});

db.connect((err) => {
    if (err) {
        console.log("DB connection error:", err);
    } else {
        console.log({ message: "Connected to DB successfully" });
    }
});

// =================== PRODUCT ROUTES ===================

// ADD PRODUCT
app.post("/post", (req, res) => {
    const { id, name, description, price, typed, createdat } = req.body;

    if (!name) return res.status(400).send({ message: "Name is required" });
    if (!price) return res.status(400).send({ message: "Price is required" });

    db.query("INSERT INTO product_detail VALUES (?, ?, ?, ?, ?, ?)",
        [id, name, description, price, typed, createdat],
        (err, result) => {
            if (err) return res.status(500).send({ message: "Database error", error: err });
            return res.send({ message: "Product inserted successfully" });
        });
});

// UPDATE PRODUCT
app.put("/update/:id", (req, res) => {
    const id = req.params.id;
    const { name, description, price, typed, createdat } = req.body;

    db.query(
        "UPDATE product_detail SET name=?, description=?, price=?, typed=?, createdat=? WHERE id=?",
        [name, description, price, typed, createdat, id],
        (err, result) => {
            if (err) return res.status(500).send(err);
            return res.send({ message: "Product updated successfully" });
        });
});
//   =========== GET ALL PRODUCT===========
// GET ALL PRODUCTS
app.get("/list", (req, res) => {
    db.query("SELECT * FROM product_detail", (err, result) => {
        if (err) return res.status(500).send(err);
        return res.status(200).send(result);
    });
});
//      ==========DELETE PRODUCT==========

// DELETE PRODUCT
app.delete("/delete/:id", (req, res) => {
    const id = req.params.id;

    db.query("SELECT * FROM product_detail WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).send(err);

        if (result.length === 0) {
            return res.status(404).send({ message: "Product not found" });
        }

        db.query("DELETE FROM product_detail WHERE id = ?", [id], (err) => {
            if (err) return res.status(500).send(err);
            return res.status(200).send({ message: "Product deleted successfully" });
        });
    });
});

// =================== USER ROUTES ===================

// ADD USER (REGISTER)
app.post("/signup", async (req, res) => {
    const { id, names, email, password, isadmin, createdat } = req.body;

    if (!names) return res.send({ message: "Please enter your name." });
    if (!email) return res.send({ message: "Please enter your email." });
    if (!password) return res.send({ message: "Please enter your password." });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.query("INSERT INTO user VALUES (?, ?, ?, ?, ?, ?)",
            [id, names, email, isadmin, createdat, hashedPassword],
            (err, result) => {
                if (err) return res.status(500).send({ message: "Database error", error: err });
                return res.send({ message: "User inserted successfully" });
            });
    } catch (err) {
        console.error("Hashing error:", err);
        return res.status(500).send({ message: "Server error during password hashing" });
    }
});
    
// LOGIN USER
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    db.query("SELECT * FROM user WHERE email = ?", [email], async (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.length === 0) return res.status(404).send({ message: "User not found" });

        const user = result[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).send({ message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id, email: user.email, isadmin: user.isadmin }, SECRET_KEY, {
            expiresIn: "2h"
        });

        return res.send({ message: "Login successful", token });
    });
});

// GET ALL USERS
app.get("/select", (req, res) => {
    db.query("SELECT * FROM user", (err, result) => {
        if (err) return res.status(500).send(err);
        return res.status(200).send(result);
    });
});

// UPDATE USER
app.put("/updateuser/:id", (req, res) => {
    const id = req.params.id;
    const { names, email, isadmin, createdat, password } = req.body;

    db.query(
        "UPDATE user SET names=?, email=?, isadmin=?, createdat=?, password=? WHERE id=?",
        [names, email, isadmin, createdat, password, id],
        (err, result) => {
            if (err) return res.status(500).send(err);
            return res.send({ message: "User updated successfully" });
        });
});

// DELETE USER
app.delete("/deleteuser/:id", (req, res) => {
    const id = req.params.id;

    db.query("SELECT * FROM user WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).send(err);

        if (result.length === 0) {
            return res.status(404).send({ message: "User not found" });
        }

        db.query("DELETE FROM user WHERE id = ?", [id], (err) => {
            if (err) return res.status(500).send(err);
            return res.status(200).send({ message: "User deleted successfully" });
        });
    });
});

// =================== SERVER START ===================


app.listen(3000, () => {
    console.log("App is listening on port 3000");
});
