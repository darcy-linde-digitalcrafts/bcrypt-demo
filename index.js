const express = require("express");
const morgan = require("morgan");
const es6Renderer = require("express-es6-template-engine");
const bcrypt = require("bcrypt");
const { User } = require("./models");

const logger = morgan("tiny");
const app = express();
const PORT = 3000;

app.engine("html", es6Renderer);
app.set("view engine", "html");

app.use(logger);
app.use(express.urlencoded({ extended: true }));

app.get("/", (_, res) => {
  res.render("index", {
    partials: { main: "/partials/welcome" },
  });
});

app.get("/new", (_, res) => {
  res.render("index", {
    partials: { main: "/partials/new" },
  });
});

app.post("/new", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    console.log("username or password is blank");
    res.send(":(");
  } else {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    try {
      await User.create({
        username,
        password: hash,
        salt,
      });
      res.redirect("/login");
    } catch (e) {
      if (e.name === "SequelizeUniqueConstraintError") {
        console.log("Username taken");
      }

      res.redirect("/new");
    }
  }
});

app.get("/login", (_, res) => {
  res.render("index", {
    partials: { main: "/partials/login" },
  });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({
    where: {
      username,
    },
  });

  if (user) {
    const isValid = await bcrypt.compare(password, user.password);
    isValid ? res.redirect("/members-only") : res.redirect("/login");
  } else {
    res.redirect("/login");
  }
});

app.get("/members-only", (req, res) => {
  res.render("index", {
    partials: { main: "/partials/members" },
  });
});

app.listen(PORT, () => {
  console.log(`Listening at http://localhost:${PORT}`);
});
