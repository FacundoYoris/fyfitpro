import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { connectDB } from './config/database';
import { errorMiddleware } from './middleware/errorMiddleware';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'FY FitPro API running' });
});

app.use('/api', routes);

app.use(errorMiddleware);

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════╗
║                                           ║
║   FY FitPro API                           ║
║   Servidor corriendo en puerto ${PORT}      ║
║                                           ║
╚═══════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();

export default app;
