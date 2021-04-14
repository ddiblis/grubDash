const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function hasDish(req, res, next) {
  const { data } = req.body;

  data
    ? next()
    : next({ status: 400, message: "A 'dish' property is required." });
}

function hasProperties(req, res, next) {
  const { data } = req.body;

  const errors = [];

  const properties = ["name", "description", "image_url", "price"];

  // Oh you needed to be able to read this? good luck!
  properties.forEach((prop) => {
    const item = data[prop];

    prop === "price"
      ? !item || item < 0
        ? errors.push(prop)
        : null
      : !item
      ? errors.push(prop)
      : null;
  });

  errors.length == 0
    ? next()
    : next({
        status: 400,
        message: `Dish requires properties ${errors.join(", ")}`,
      });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id == dishId);

  foundDish
    ? ((res.locals.dish = foundDish), next())
    : next({ status: 404, message: `Dish id not found ${dishId}` });
}

function create(req, res) {
  const { data } = req.body;
  const newDish = {
    id: nextId(),
    ...data,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function destroy(req, res) {
  const { dishId } = req.params;
  const index = dishes.findIndex((dish) => dish.id == dishId);
  index > -1 ? dishes.splice(index, 1) : null;

  res.status(405).json({ error: index });
}

function list(req, res) {
  res.json({ data: dishes });
}

function read(req, res) {
  const foundDish = res.locals.dish;
  res.json({ data: foundDish });
}

function update(req, res, next) {
  let foundDish = res.locals.dish;
  const { dishId } = req.params;
  const { data } = req.body;
  let id;

  //  Apparently if you chain a bunch of tenerary operators they act as if elseif statements? So...
  //  Oh apparently you can't declare anything as constant inside them so I had to add a let for the
  //  variable I wanted to use outside as you can see.
  typeof data.price !== "number"
    ? next({ status: 400, message: "price must be a number." })
    : !data.id
    ? ((id = foundDish.id),
      (foundDish = data),
      (foundDish.id = id),
      res.json({ data: foundDish }))
    : data.id !== dishId
    ? next({ status: 400, message: `id does not match ${data.id}` })
    : ((foundDish = data), res.json({ data: foundDish }));
}

module.exports = {
  list,
  create: [hasDish, hasProperties, create],
  read: [dishExists, read],
  update: [dishExists, hasDish, hasProperties, update],
  delete: destroy,
};
