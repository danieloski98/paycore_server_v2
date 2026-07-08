import { v2 } from 'cloudinary';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const Cloudinary = v2;

Cloudinary.config({
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
});

export default Cloudinary;
