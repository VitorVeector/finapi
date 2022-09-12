const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const customers = [];

const verifyExistsAccountCPF = (req, res, next) => {
  const { cpf } = req.headers;
  const customer = customers.find((client) => client.cpf === cpf);
  if (!customer) {
    return res.status(400).json({ error: "Customer does not exists!" });
  }
  req.customer = customer;
  return next();
};

const getBalance = (statement) => {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === "credit") {
      return acc + operation.amount;
    } else if (operation.type === "debit") {
      return acc - operation.amount;
    }
  }, 0);
  return balance
};

app.post("/account", (req, res) => {
  const { cpf, name } = req.body;

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );
  if (customerAlreadyExists) {
    return res.status(400).json({ error: "Customer already exists!" });
  } else {
    customers.push({
      cpf,
      name,
      id: uuidv4(),
      statement: [],
    });

    return res.status(201).send();
  }
});

app.get("/statement", verifyExistsAccountCPF, (req, res) => {
  const { customer } = req;
  return res.json(customer.statement);
});

app.post("/deposit", verifyExistsAccountCPF, (req, res) => {
  const { description, amount } = req.body;

  const { customer } = req;


  const statementOperation = {
    description,
    amount,
    created_at: new Date().toLocaleDateString("pt-BR"),
    type: "credit",
  };

  customer.statement.push(statementOperation);
  return res.status(201).send();
});

app.post("/withdraw", verifyExistsAccountCPF, (req, res) => {
  const { description, amount } = req.body;

  const { customer } = req;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return res.status(400).json({ error: "Insufficient funds"});
  } else {
    const statementOperation = {
      description,
      amount,
      created_at: new Date().toLocaleDateString("pt-BR"),
      type: "debit",
    }

    customer.statement.push(statementOperation)
    return res.status(201).send();
  }
});

app.get("/statement/date", verifyExistsAccountCPF, (req, res) => {
  const { customer } = req;

  const {date} = req.query

  const dateFormat = new Date(date).toLocaleDateString("pt-BR")
  const statement = customer.statement.filter(state => {
    return state.created_at === dateFormat
  })

  return res.json(statement);
});

app.put("/account", verifyExistsAccountCPF, (req, res) => {
  const {name} = req.body
  const {customer} =req
  customer.name = name
  res.status(201).json({newName: customer.name})
})

app.delete("/account", verifyExistsAccountCPF, (req, res) => {
  const {customer} = req
  customers.splice(customer, 1)
  return res.status(200).json(customers)
})

app.get("/account", verifyExistsAccountCPF, (req, res) => {
  const {customer} = req
  res.json(customer)
})

app.get("/accounts", (req, res) => {
  res.json(customers)
})

app.listen(3030, () => {
  console.log("Server started on port 3030");
});
