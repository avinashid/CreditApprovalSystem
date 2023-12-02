const pool = require("../config/db");

class EmployeeModel {
  static getCustomer = async ({ customer_id }) => {
    const users = await pool.query(`Select * from employees_information
    where employee_id=${customer_id};`);
    return users.rows;
  };
  static getAllCustomer = async () => {
    const users = await pool.query("SELECT * FROM employees_information");
    return users;
  };

  static addNewCustomer = async ({
    first_name,
    last_name,
    age,
    monthly_salary,
    phone_number,
  }) => {
    const approved_limit = Math.round(36 * (monthly_salary / 100000)) * 100000;
    const result = await pool.query(
      `INSERT INTO employees_information 
      (first_name, last_name, age, monthly_salary, approved_limit, phone_number, current_debt) 
      VALUES ($1, $2, $3, $4, $5, $6, 0) 
      RETURNING *`,
      [first_name, last_name, age, monthly_salary, approved_limit, phone_number]
    );
    return result.rows[0];
  };

  static getLoanDetails = async ({ customer_id }) => {
    const result = await pool.query(
      `SELECT * FROM loan_information WHERE Customer_id=${customer_id};`
    );
    return result.rows;
  };

  static getCreditScore = async ({ customer_id }) => {
    let creditScore = 0;

    const getPastLoan = await this.getLoanDetails({ customer_id });
    const totalLoan = getPastLoan.length;
    if (totalLoan < 3) creditScore += 10;
    else if (totalLoan < 6) creditScore += 20;
    else creditScore += 30;

    if (totalLoan > 0) {
      const customer = await this.getCustomer({ customer_id });
      const approved_limit = customer[0].approved_limit;

      const totalLoanAmount = getPastLoan.reduce(
        (sum, loan) => sum + parseFloat(loan.loan_amount),
        0
      );
      const totalEffectiveLoan = getPastLoan.reduce(
        (sum, loan) =>
          sum +
          Math.round(
            (loan.loan_amount / loan.tenure) *
              (loan.tenure - loan.emis_paid_on_time)
          ),
        0
      );
      if (totalEffectiveLoan > approved_limit) return 0;
      if (totalLoanAmount < 500000) creditScore += 10;
      else if (totalLoanAmount < 1500000) creditScore += 20;
      else if (totalLoanAmount < 5000000) creditScore += 30;
      else creditScore += 40;
    }

    const customerInfo = await this.getCustomer({ customer_id });
    if (customerInfo.monthly_salary < 10000) creditScore += 0;
    else if (customerInfo.monthly_salary < 100000) creditScore += 10;
    else if (customerInfo.monthly_salary < 300000) creditScore += 20;
    else creditScore += 30;
    return creditScore;
  };
  static;
}

module.exports = EmployeeModel;
