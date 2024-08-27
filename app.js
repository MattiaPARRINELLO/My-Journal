const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const session = require("express-session");
const path = require("path");
const multer = require("multer");
const dotenv = require("dotenv");
dotenv.config();

const validUsers = JSON.parse(process.env.USER_LIST)

const upload = multer({ dest: "uploads/" });
app = express();
const port = 3000;
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: true }));
// make /uploads folder static
app.use("/uploads", express.static("uploads"));
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

app.get("/", (req, res) => {
  if (req.session.loggedin) {
    res.redirect("/home");
  } else {
    res.render(__dirname + "/view/login.ejs");
  }
});

app.post("/auth", (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  if (username && password) {
    let validUser = validUsers.find(
      (user) => user.username === username && user.password === password
    );
    if (validUser) {
      req.session.loggedin = true;
      req.session.username = username;
      res.redirect("/home");
    } else {
      res.send("Incorrect Username and/or Password!");
    }
    res.end();
  } else {
    res.send("Please enter Username and Password!");
    res.end();
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
  res.end();
});

app.get("/home", (req, res) => {
  if (req.session.loggedin) {
    fs.readFile(__dirname + "/data.json", "utf8", (err, data) => {
      if (err) {
        console.log(err);
        return;
      }
      let jsonData = JSON.stringify(data);
      res.render(__dirname + "/view/home.ejs", {
        username: req.session.username,
        data: jsonData,
      });
    });
  } else {
    res.redirect("/");
  }
});

app.get("/publier", (req, res) => {
  if (req.session.loggedin) {
    res.render(__dirname + "/view/publier.ejs", {
      username: req.session.username,
    });
  } else {
    res.redirect("/");
  }
});

app.post("/uploadFiles", upload.array("media"), (req, res) => {
  console.log(req.body);
  console.log(req.files);
  fs.readFile(__dirname + "/data.json", "utf8", (err, data) => {
    if (err) {
      console.log(err);
      return;
    }
    req.files.forEach((file) => {
      fs.rename(
        file.path,
        file.path + "." + file.mimetype.split("/")[1],
        (err) => {
          if (err) {
            console.log(err);
            return;
          }
        }
      );
    });
    let jsonData = JSON.parse(data);
    if (req.body.dataType === "photo") {
      jsonData.push({
        id: req.files[0].filename,
        titre: req.body.titre,
        description: req.body.description,
        date: req.body.date,
        auteur: req.body.auteur,
        type: req.body.dataType,
        photo: {
          url: req.files[0].path + "." + req.files[0].mimetype.split("/")[1],
        },
      });
    } else if (req.body.dataType === "video") {
      jsonData.push({
        id: req.files[0].filename,
        titre: req.body.titre,
        description: req.body.description,
        date: req.body.date,
        auteur: req.body.auteur,
        type: req.body.dataType,
        video: {
          url: req.files[1].path + "." + req.files[1].mimetype.split("/")[1],
          photo: req.files[0].path + "." + req.files[0].mimetype.split("/")[1],
        },
      });
    }
    fs.writeFile(__dirname + "/data.json", JSON.stringify(jsonData), (err) => {
      if (err) {
        console.log(err);
        return;
      }
      res.redirect("/home");
    });
  });
});

app.get("/detail/:id", (req, res) => {
  if (req.session.loggedin) {
    fs.readFile(__dirname + "/data.json", "utf8", (err, data) => {
      if (err) {
        console.log(err);
        return;
      }
      let jsonData = JSON.parse(data);
      let item = jsonData.find((item) => item.id === req.params.id);
      res.render(__dirname + "/view/detail.ejs", {
        username: req.session.username,
        item: item,
      });
    });
  } else {
    res.redirect("/");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  fs.readFile(__dirname + "/data.json", "utf8", (err, data) => {
    if (err) {
      console.log(err);
      return;
    }
    if (data === "") {
      fs.writeFile(__dirname + "/data.json", "[]", (err) => {
        if (err) {
          console.log(err);
          return;
        }
      });
    }
  });
});
