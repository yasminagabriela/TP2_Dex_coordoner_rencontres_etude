
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

app.use((erreur, req,res,next) => {
  res.status(404).json({ erreurs : [ 'Ressource introuvable.'] });
});

app.use((erreur,req,res,next) => {
  if(erreur.type === 'entity.parse.failed') {
    return res.status(400).json({erreurs : ['Le corps de la req doit etre en JSON']});
  }

  console.error(erreur);
  res.status(500).json({erreurs : ['Erreur du server.'] });
}

);

app.listen(PORT, () => {
  console.log(`API de DEX : http://localhost:${PORT}/api`); 
});