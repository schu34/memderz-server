const fs = require("fs");
const db = require("mongo-utility")("mongodb://theBestTeam:password1@ds133601.mlab.com:33601/tinder-meme")

dirs = fs.readdirSync(__dirname + "/images").filter(dir => dir[0] !== ".");

dirs.forEach(dir => {
  const files = fs.readdirSync(__dirname + "/images" + "/" + dir).filter(file => file[0] !== ".");
  files.forEach(file => {
    db.insert("images", {
      id: file,
      catagory: dir,
      url: "/images/" + dir + "/" + file,
    })

  })
})