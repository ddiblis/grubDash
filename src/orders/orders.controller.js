const path = require("path");
const { isArray } = require("util");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function hasOrder(req, res, next) {
  const { data } = req.body;

  data
    ? next()
    : next({ status: 400, message: "An 'order' property is required." });
}

function hasProperties(req, res, next) {
  const { data } = req.body;

  const errors = [];

  const properties = ["deliverTo", "mobileNumber", "dishes"];

  properties.forEach((prop) => {
    const item = data[prop];

    prop === "dishes"
      ? !item || !Array.isArray(item) || !item.length
        ? errors.push(prop)
        : item.forEach((dish) => {
            const quantity = dish.quantity;

            !quantity || typeof quantity !== "number" || quantity == 0
              ? errors.push(`dish:${dish.id} quantity`)
              : null;
          })
      : !item
      ? errors.push(prop)
      : null;
  });

  errors.length == 0
    ? next()
    : next({
        status: 400,
        message: `Order requires properties ${errors.join(", ")}`,
      });
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);

  foundOrder
    ? ((res.locals.order = foundOrder), next())
    : next({ status: 404, message: `Order id not found ${orderId}` });
}

function create(req, res) {
  const { data } = req.body;
  const newOrder = {
    id: nextId(),
    ...data,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function destroy(req, res, next) {
  const { orderId } = req.params;
  const order = res.locals.order;
  let index;

  order.status !== "pending"
    ? next({ status: 400, message: "You can only delete pending orders." })
    : (index = orders.findIndex((order) => order.id == orderId)),
    index > -1
      ? (orders.splice(index, 1), res.status(204).json({ error: index }))
      : null;
}

function list(req, res) {
  res.json({ data: orders });
}

function read(req, res) {
  const foundOrder = res.locals.order;
  res.json({ data: foundOrder });
}

function update(req, res, next) {
  let foundOrder = res.locals.order;
  const { orderId } = req.params;
  const { data } = req.body;
  let id;

  // I did this out of boredom and to expriment and see how far I could take it all.
  !data.status || data.status == "invalid"
    ? next({ status: 400, message: "Order must have a valid status." })
    : !data.id || data.id === ""
    ? ((id = foundOrder.id),
      (foundOrder = data),
      (foundOrder.id = id),
      res.json({ data: foundOrder }))
    : data.id !== orderId
    ? next({ status: 400, message: `id does not match ${data.id}` })
    : ((foundOrder = data), res.json({ data: foundOrder }));
}

module.exports = {
  list,
  create: [hasOrder, hasProperties, create],
  read: [orderExists, read],
  update: [orderExists, hasOrder, hasProperties, update],
  delete: [orderExists, destroy],
};
