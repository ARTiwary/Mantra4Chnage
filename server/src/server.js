import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` PBL Intelligence Server running on port ${PORT}`);
    console.log(` Static image routing accessible via /images/`);
    console.log(`====================================================`);
});