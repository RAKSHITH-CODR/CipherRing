import express from 'express';
import multer from 'multer';
import fs from 'fs';
import csv from 'csv-parser';
import { validateCsv } from '../utils/validateCSV.js';
import { detectFraud } from '../utils/detect.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const results = [];
  let headerError = null;
  let responseSent = false;

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('headers', (headers) => {
      const missing = validateCsv(headers);
      if (missing.length > 0) {
        headerError = `Missing required columns: ${missing.join(', ')}`;
      }
    })
    .on('data', (data) => {
      if (headerError) return;
      data.amount = parseFloat(data.amount) || 0;
      results.push(data);
    })
    .on('end', () => {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
      
      if (responseSent) return;
      responseSent = true;
      
      if (headerError) {
        return res.status(400).json({ error: headerError });
      }
      
      if (results.length === 0) {
        return res.status(400).json({ error: 'No valid transactions found in CSV' });
      }
      
      const output = detectFraud(results);
      res.json(output);
    })
    .on('error', (err) => {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
      
      if (responseSent) return;
      responseSent = true;
      
      res.status(500).json({ error: 'Error processing CSV file' });
    });
});

export default router;
