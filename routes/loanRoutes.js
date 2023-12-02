const { Router } = require("express");
const router = Router();
const {
  createLoan,
  viewStatement,
  viewLoan,
  makePayment,
} = require("../controllers/loanControllers");

router.get("/", (req, res) => {
  res.send("USIng api");
});

router.post("/create-loan", createLoan);

router.get("/view-loan/:loan_id", viewLoan);

router.post("/make-payment/:customer_id/:loan_id", makePayment);

router.get("/view-statement/:customer_id", viewStatement);

module.exports = router;