import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { SERVER_PORT } from './config.js'
import indexRouter from './routes/index.js';


// Creating a express object.
const app = express();

app.use(cors());
app.use(express.json())


// Routes
app.use("/api", indexRouter);


// Error handler (example)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});


// Start Listening the Server
app.listen(SERVER_PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://localhost:${SERVER_PORT}`);
});