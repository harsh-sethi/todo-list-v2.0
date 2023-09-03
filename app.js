//jshint esversion:6

import dotenv from 'dotenv';
if(process.env.NODE_ENV !== "production"){
  dotenv.config();
}

const dbUrl = process.env.DB_URL || "mongodb://127.0.0.1/todolistDB";

import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from 'lodash';

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// mongoose.connect("mongodb://127.0.0.1/todolistDB");
mongoose.connect(dbUrl);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String, 
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  
  Item.find({}).then(foundItems => {

    if(foundItems.length === 0){
      Item.insertMany(defaultItems)
    .then(function(){
      console.log("Succesfully saved default items into our DB.")
    })
    .catch(function(err){
      console.log(err);
    });
    res.redirect("/");
    }
    else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  })
  .catch(err => {
    console.log(err);
  });
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName})
  .then(function(foundList){

    if(!foundList){
      // create a new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });

      list.save()
      .then(function(){
        console.log("Saved!");
        res.redirect("/" + customListName); //Redirect after saving the new list
      });
    }

    else{
      // show an existing list
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  })
  .catch(function(err){
    console.log("Doesn't Exist");
  })

  const list = new List({
    name: customListName,
    items: defaultItems
  });

  list.save();

  
});

// ADDING ITEMS TO DB
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName == "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName})
      .then(function(foundList){
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId).then(function(foundItem){
      Item.deleteOne({_id: checkedItemId})
    })
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
    .then(function(foundList){
      res.redirect("/" + listName);
    });
  }

});

app.get("/about", function(req, res){
  res.render("about");
});

const port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Server started on port 3000");
});
