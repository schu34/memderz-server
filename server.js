const express = require("express");
const app = express();
const uuid = require("uuid/v4");
const db = require("mongo-utility")("mongodb://theBestTeam:password1@ds133601.mlab.com:33601/tinder-meme")
const cors = require("cors")
const fs = require("fs");
app.use(express.json({
  extended: false
}));

app.use(cors())
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

app.get("/signup/:username", (req, res) => {
  db.findMany("users", {
      user_name: req.params.username
    })
    .then(users => {
      if (users.length) {

        return Promise.reject({
          code: 406,
          message: "username taken"
        })
      }
      console.log(users);
      return db.insert("users", {
        "user_id": uuid(),
        "user_name": req.params.username,
        "cartoon_count": 0,
        "people_count": 0,
        "animal_count": 0,
        "car_count": 0
      })

    })
    .then(() => {
      console.log("wtf");
      res.sendStatus(200)
    })
    .catch(err => handleErrors(err, res));
})

app.get("/login/:userName", (req, res) => {
  db.findMany("users", {
      user_name: req.params.userName
    })
    .then(users => {
      if (!users.length) {
        res.sendStatus(404);
      } else {
        console.log(users);
        res.send({
          user: users[0]
        });
      }
    })
    .catch(err => handleErrors(err, res))
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
        return Promise.all(matches[0].matches.map(user_id => {
          return db.findMany("users", {
            user_id
          }).then(users => users[0])
        }))
        res.json(matches[0]);
      }
    })
    .then(users => res.json(users))
    .catch(err => handleErrors(err, res));
})

app.get("/meme", (req, res) => {
  db.findMany("images", {})
    .then(images=>{
      res.send(getRandom(images))
    })
})

function getRandom(array) {
  return array[Math.floor(Math.random() * array.length)]
}
app.get("/chat/:user1/:user2", (req, res) => {
  return findChat(req.params.user1, req.params.user2)
    .then(chat => {
      console.log(chat)
      return res.json(chat);
    })
    .catch(err => handleErrors(err, res));

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
      this.chat = chat
      return db.update("chats", chat)
    })
    .then(() => {
      res.send(this.chat);
    })
    .catch(err => handleErrors(err, res));
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
    messages: [{
      text: "welcome to chat",
      sender: "me",
      timestamp: new Date(),
    }],
  }
  return db.insert("chats", newChat)
    .then(() => newChat);
}

function handleErrors(err, res) {
  console.log(err);
  if (err === "break") res.sendStatus(200);
  else if (err.code && err.message) {
    res.status(err.code).json(err.message);
  } else if (err.code) {
    res.sendStatus(err.code);
  }
}

const port = process.env.PORT || 4000

app.listen(port, () => {
  console.log("listeing on port", port)
})