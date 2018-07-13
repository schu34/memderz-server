const express = require("express");
const app = express();
const uuid = require("uuid/v4");
const db = require("mongo-utility")("mongodb://theBestTeam:password1@ds133601.mlab.com:33601/tinder-meme")

app.use(express.json({
  extended: false
}));

app.use("/images", express.static(__dirname + "/images"));

app.get("/profile/:id", (req, res) => {
  db.findMany("users", {
      user_id: req.params.id
    })
    .then(users => {
      if (users.length) {
        res.json(users[0]);
      } else {
        res.sendStatus(404);
      }
    })

})

app.get("/login/:userName", (req, res) => {
  db.findMany("users", {
      user_name: req.params.userName
    })
    .then(users => {
      if (!users.length) {
        res.sendStatus(404);
      } else {
        res.send(users[0].user_id);
      }
    })
})

app.get("/swipe/:user/:id/:score", (req, res) => {

  const {
    user,
    id,
    score
  } = req.params;
  console.log(user, id, score)

  const scoreInt = parseInt(score);

  db
    .findMany("likes", {
      user_id: user,
      image_id: id
    })
    .then(likes => {
      if (likes.length) {
        res.sendStatus(200)
        return Promise.reject("break");
      }
      db.insert("likes", {
        user_id: user,
        image_id: id
      })
    })
    .then(() => {
      return db.findMany("images", {
        id: id
      });
    })
    .then(images => {
      const image = images[0]
      this.catagory = image.catagory;
      console.log(image)
      return db.findMany("users", {
        user_id: user
      });
    })
    .then(users => {

      const user = users[0]

      console.log(user);
      const key = this.catagory + "_count"
      user[key] += scoreInt;
      console.log(user)
      return db.update("users", user);
    })
    .then(() => {
      res.sendStatus(200);
    })
    .catch(err => {
      if (err === "break")
        return Promise.resolve();
      else console.log(err)
    })
})

app.get("/matches/:userId", (req, res) => {
  db.findMany("matches", {
      user_id: req.params.userId
    })
    .then(matches => {

      if (!matches) return Promise.reject({
        code: 404
      })

      else {
        res.json(matches[0]);
      }
    })
    .catch(handleErrors)
})

app.get("/chat/:user1/:user2", (req, res) => {
  return findChat(req.params.user1, req.params.user2)
    .then(chat => {
      return res.json(chat);
    })
})

app.post("/chat", (req, res) => {
  const {
    message,
    sender,
    reciever
  } = req.body;
  if (!message || !sender || !reciever) {
    return res.sendStatus(400);
  }

  findChat(sender, reciever)
    .then(chat => {
      chat.messages.push({
        text: message,
        sender,
        timestamp: new Date(),
      })
      return db.update("chats", chat)
    })
    .then(() => {
      res.send(chat);
    })
})

function findChat(user1, user2) {
  return db.findMany("chats", {
    $or: [{
      user1,
      user2
    }, {
      user1: user2,
      user2: user1
    }]
  }).then(chats => {
    if (!chats.length) {
      return createChat(user1, user2)
    } else {
      return chats[0];
    }
  })
}

function createChat(user1, user2) {
  const newChat = {
    chat_id: uuid(),
    user1,
    user2,
    messages: [],
  }
  db.insert("chats", newChat)
    .then(() => newChat);
}

function handleErrors(err, res) {
  console.log(err);
  if (err === "break") res.sendStatus(200);
  else if (err.code) {
    res.sendStatus(code);
  }
}

app.listen(4000, () => {
  console.log("listeing on port 4000")
})