import express from 'express';
import cors from 'cors';
import uploadRoute from './routes/upload.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/upload', uploadRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
