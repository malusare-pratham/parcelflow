const { v2: cloudinary } = require('cloudinary');
const { Readable } = require('stream');

cloudinary.config({
  secure: true,
});

const isCloudinaryEnabled = () => !!process.env.CLOUDINARY_URL;

const uploadBuffer = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    Readable.from(buffer).pipe(stream);
  });

module.exports = { cloudinary, isCloudinaryEnabled, uploadBuffer };

