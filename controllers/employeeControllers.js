const EmployeeModel = require("../models/employeeModel");

const getAllEmployee = async (req, res) => {
  const users = await EmployeeModel.getAllCustomer();
  res.json(users);
};

const registerEmployee = async (req, res) => {
  const { first_name, last_name, monthly_salary, phone_number } = req.body;
  if (!first_name || !last_name || !monthly_salary || !phone_number)
    return res.status(400).json({ message: "Bad request" });
  try {
    const data = await EmployeeModel.addNewCustomer(req.body);
    res.status(201).json(data);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Error" });
  }
};

const checkEligibility = async (req, res) => {
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
    return res.status(200).json({
      customer_id,
      approval,
      interest_rate,
      corrected_interest_rate,
      tenure,
      monthly_installment,
    });
  }

  // Not approved any loans
  res.status(400).json({
    customer_id,
    approval,
    interest_rate: 0,
    corrected_interest_rate: 0,
    tenure: 0,
    monthly_installment: 0,
  });
};



module.exports = {
  getAllEmployee,
  checkEligibility,
  registerEmployee,
};
