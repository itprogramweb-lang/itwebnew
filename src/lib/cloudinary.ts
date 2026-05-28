// server-only: ห้าม import ใน client component
import { v2 as cloudinary } from "cloudinary";

function getCloudinaryConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Missing Cloudinary env vars: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET"
    );
  }
  return { cloudName, apiKey, apiSecret };
}

let _configured = false;
function ensureConfigured() {
  if (_configured) return;
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  _configured = true;
}

export type CloudinaryUploadResult = {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
};

export async function uploadToCloudinary(
  buffer: Buffer,
  options: { folder?: string; publicId?: string } = {}
): Promise<CloudinaryUploadResult> {
  ensureConfigured();
  const baseFolder = process.env.CLOUDINARY_FOLDER || "it-rmutt";
  const folder = options.folder
    ? `${baseFolder}/${options.folder}`
    : baseFolder;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        ...(options.publicId ? { public_id: options.publicId } : {}),
      },
      (error, result) => {
        if (error || !result) reject(error || new Error("Upload failed"));
        else
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
      }
    );
    stream.end(buffer);
  });
}
