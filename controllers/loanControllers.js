const EmployeeModel = require("../models/employeeModel");
const LoanModel = require("../models/loanModel");

const createLoan = async (req, res) => {
  // Check if all data is given
  const { customer_id, loan_amount, interest_rate, tenure } = req.body;
  if (!customer_id || !loan_amount || !interest_rate || !tenure)
    return res.status(400).json({ message: "Bad request" });

  // Check if customer_id exist
  const isCustomer = await EmployeeModel.getCustomer({ customer_id });
  if (isCustomer.length == 0)
    return res.status(400).json({ message: "Not a valid customer" });

  // Get credit Score
  const creditScore = await EmployeeModel.getCreditScore({ customer_id });

  // Approve Credit Score
  let approval = false;
  let corrected_interest_rate = interest_rate;
  console.log(creditScore);
  if (creditScore > 50) approval = true;
  else if (creditScore > 30) {
    approval = true;
    if (interest_rate < 12) corrected_interest_rate = 12;
  } else if (creditScore > 10) {
    approval = true;
    if (interest_rate < 16) corrected_interest_rate = 16;
  } else approval = false;

  // Calculate monthly installment
  const monthlyInterestRate = corrected_interest_rate / 12 / 100;
  const emi =
    (loan_amount *
      monthlyInterestRate *
      Math.pow(1 + monthlyInterestRate, tenure)) /
    (Math.pow(1 + monthlyInterestRate, tenure) - 1);
  const monthly_installment = Math.round(emi);

  if (approval) {
    try {
      const loan = await LoanModel.createLoan({
        customer_id,
        loan_amount,
        interest_rate: corrected_interest_rate,
        tenure,
        monthly_repayment: monthly_installment,
      });
      return res.status(201).json({
        loan_id: loan.loan_id,
        customer_id,
        loan_approved: true,
        message: "Loan approved and created",
        monthly_installment: loan.monthly_repayment,
      });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  // No loan appproved
  return res.status(201).json({
    loan_id: null,
    customer_id,
    loan_approved: false,
    message: "Credit Score too low",
    monthly_installment: null,
  });
};

const viewLoan = async (req, res) => {
  const loan_id = req.params.loan_id;
  if (!loan_id) return res.status(400).json({ message: "Provide loan_id" });

  const loan = await LoanModel.viewLoan({ loan_id });

  if (!loan) return res.status(400).json({ message: "Invalid loan_id" });

  const customer = await EmployeeModel.getCustomer({
    customer_id: loan.customer_id,
  });
  if (!customer)
    return res.status(500).json({ message: "Something went wrong" });

  res.status(200).json({
    loan_id,
    customer: customer[0],
    loan_amount: loan.loan_amount,
    interest_rate: loan.interest_rate,
    monthly_installment: loan.monthly_installment,
    tenure: loan.tenure,
  });
};

const makePayment = async (req, res) => {
  const { customer_id, loan_id } = req.params;
  const emi = req.body.emi;
  if (!customer_id || !loan_id || !emi)
    return res.status(400).json({ message: "Invalid Data" });

  const customer = await EmployeeModel.getCustomer({ customer_id });
  const loan = await LoanModel.viewLoan({ loan_id });

  if (customer.length == 0)
    return res.status(404).json({ message: "Customer Id not found" });
  else if (!loan) return res.status(404).json({ message: "Invalid Loan Id" });

  const tenureLeft = loan.tenure - loan.emis_paid_on_time;
  const amountLeft = loan.monthly_repayment * tenureLeft;

  console.log(emi, amountLeft);
  if (amountLeft < emi)
    return res
      .status(403)
      .json({ message: "emi amount succedded loan amount" });

  const newMonthlyRepayment = (amountLeft - emi) / (tenureLeft - 1);
  console.log(newMonthlyRepayment);
  try {
    const updateLoan = await LoanModel.makePayment({
      loan_id,
      customer_id,
      monthly_repayment: newMonthlyRepayment,
    });
    res.status(201).json(updateLoan);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const viewStatement = async (req, res) => {
  const customer_id = req.params.customer_id;
  if (!customer_id) return res.status(400).json("provide customer Id");
  const customer = await EmployeeModel.getCustomer({ customer_id });
  if (customer.length == 0)
    return res.status(404).json({ message: "Customer Id not found" });

  const loanData = await LoanModel.getLoan({ customer_id });
  if (loanData.length === 0) return res.status(204).json("Not taken any loan");
  const returnData = loanData.map((e) => {
    return {
      customer_id: e.customer_id,
      loan_id: e.loan_id,
      principle: e.loan_amount,
      interest_rate: e.interest_rate,
      Amount_paid: e.monthly_repayment * (e.tenure - e.emis_paid_on_time),
      monthly_installment: e.monthly_repayment,
      repayments_left: e.tenure - e.emis_paid_on_time,
    };
  });
  return res.status(201).json(returnData);
};

module.exports = { createLoan, viewLoan, makePayment, viewStatement };
