
import adminRouter from './routes/admin.js';
import publicRouter from './routes/public.js';
import cors from 'cors';
import express from 'express';


const app = express();
const PORT = 3000;

app.use(cors({
  origin: 'http://localhost',
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(adminRouter);
app.use(publicRouter);


app.listen(PORT, () => {
  console.log(`API de DEX : http://localhost:${PORT}/api`); 
});