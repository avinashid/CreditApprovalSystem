const pool = require("../config/db");

class LoanModel {
  static viewLoan = async ({ loan_id }) => {
    const loan = await pool.query(
      `select * from loan_information where loan_id = ${loan_id}`
    );
    return loan.rows[0];
  };
  static getLoan = async ({ customer_id }) => {
    const allLoan = await pool.query(
      `select * from loan_information where customer_id = $1`,
      [customer_id]
    );
    return allLoan.rows;
  };
  static makePayment = async ({ loan_id, customer_id, monthly_repayment }) => {
    const updateQuery = await pool.query(
      `UPDATE loan_information
     SET monthly_repayment = $1,
     emis_paid_on_time = emis_paid_on_time + 1
     WHERE customer_id = $2 AND loan_id = $3 returning *`,
      [monthly_repayment, customer_id, loan_id]
    );
    return updateQuery.rows[0];
  };

  static createLoan = async ({
    customer_id,
    loan_amount,
    interest_rate,
    tenure,
    monthly_repayment,
  }) => {
    const max_loan_id = await pool.query(
      `select max(loan_id) from loan_information`
    );
    const loan_id = max_loan_id.rows[0].max + 1;

    // calculate start and end date
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + tenure);
    const start_date = startDate.toISOString().split("T")[0];
    const end_date = endDate.toISOString().split("T")[0];
    const result = await pool.query(
      `INSERT INTO loan_information
      (customer_id, loan_id, loan_amount, tenure, interest_rate, monthly_repayment, emis_paid_on_time, start_date, end_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [
        customer_id,
        loan_id,
        loan_amount,
        tenure,
        interest_rate,
        monthly_repayment,
        0,
        start_date,
        end_date,
      ]
    );
    return result.rows[0];
  };
}

module.exports = LoanModel;
