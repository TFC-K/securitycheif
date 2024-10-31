import 'dotenv/config';
import * as http from './src/http';

http.listen(parseInt(process.env.HTTP_PORT ?? '80'));