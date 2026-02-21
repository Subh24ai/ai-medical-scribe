const express = require('express');
const router = express.Router();
const drugController = require('../controllers/drug.controller');
const { authenticate } = require('../middleware/auth');

router.get('/search', authenticate, drugController.searchDrugs);
router.get('/:id', authenticate, drugController.getDrugInfo);
router.post('/interactions', authenticate, drugController.checkInteractions);

module.exports = router;