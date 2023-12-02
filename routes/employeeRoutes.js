const { Router } = require("express");
const router = Router();
const {
  getAllEmployee,
  checkEligibility,
  registerEmployee,
} = require("../controllers/employeeControllers");

router.get("/", getAllEmployee);

router.post("/register", registerEmployee);

router.post("/check-eligibility", checkEligibility);



module.exports = router;
