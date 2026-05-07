const { v2: cloudinary } = require('cloudinary');
const { Readable } = require('stream');

const configureFromEnv = () => {
  const raw = process.env.CLOUDINARY_URL;
  if (!raw) {
    cloudinary.config({ secure: true });
    return { enabled: false };
  }

  try {
    // Format: cloudinary://<api_key>:<api_secret>@<cloud_name>
    const url = new URL(raw);
    const cloudName = url.hostname;
    const apiKey = decodeURIComponent(url.username || '');
    const apiSecret = decodeURIComponent(url.password || '');

    if (!cloudName || !apiKey || !apiSecret) {
      cloudinary.config({ secure: true });
      return { enabled: false, reason: 'CLOUDINARY_URL missing credentials' };
    }

    cloudinary.config({
      secure: true,
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    return { enabled: true };
  } catch {
    cloudinary.config({ secure: true });
    return { enabled: false, reason: 'Invalid CLOUDINARY_URL' };
  }
};

const cloudinaryState = configureFromEnv();

const isCloudinaryEnabled = () => !!cloudinaryState.enabled;

const uploadBuffer = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    Readable.from(buffer).pipe(stream);
  });

module.exports = { cloudinary, isCloudinaryEnabled, uploadBuffer, cloudinaryState };
