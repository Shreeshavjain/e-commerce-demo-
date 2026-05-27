import { Readable } from "node:stream";
import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse, type DeleteApiResponse } from "cloudinary";
import { env } from "@/config/env";

export type CloudinaryUploadResult = UploadApiResponse;
export type CloudinaryDeleteResult = DeleteApiResponse;

export type CloudinaryFolderContext = {
  subfolder?: string;
  productSlug?: string;
  variantId?: string;
  colorName?: string;
};

let cloudinaryConfigured = false;

function getCloudinaryConfig() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error("Missing Cloudinary environment variables");
  }

  return {
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  };
}

function normalizeFolderSegment(segment: string) {
  return segment
    .trim()
    .toLowerCase()
    .replace(/["'’]/g, "")
    .replace(/[^a-z0-9/_-]+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/-{2,}/g, "-")
    .replace(/^\/+|\/+$/g, "");
}

export function buildCloudinaryFolderPath(context: CloudinaryFolderContext = {}) {
  const baseFolder = env.CLOUDINARY_UPLOAD_FOLDER_PREFIX ?? "ecommerce/products";
  const segments = [baseFolder, context.subfolder, context.productSlug, context.colorName, context.variantId]
    .filter(Boolean)
    .map((segment) => normalizeFolderSegment(String(segment)))
    .filter(Boolean);

  return segments.join("/");
}

// Cloudinary stores media files, while MongoDB stores the metadata and the returned file URLs.
// This keeps the database lean and lets the ecommerce app serve images and videos from a media-optimized provider.
export function getCloudinaryClient() {
  if (!cloudinaryConfigured) {
    cloudinary.config(getCloudinaryConfig());
    cloudinaryConfigured = true;
  }

  return cloudinary;
}

export function buildCloudinaryUploadOptions(options?: UploadApiOptions): UploadApiOptions {
  return {
    resource_type: "image",
    folder: buildCloudinaryFolderPath(),
    overwrite: false,
    unique_filename: true,
    use_filename: false,
    ...options,
  };
}

export async function uploadBufferToCloudinary(buffer: Buffer, options?: UploadApiOptions): Promise<UploadApiResponse> {
  const client = getCloudinaryClient();
  const uploadOptions = buildCloudinaryUploadOptions(options);

  return await new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = client.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error || !result) {
        reject(error ?? new Error("Cloudinary upload failed"));
        return;
      }

      resolve(result);
    });

    Readable.from([buffer]).pipe(uploadStream);
  });
}

export async function deleteCloudinaryAsset(publicId: string): Promise<CloudinaryDeleteResult> {
  const result = await getCloudinaryClient().uploader.destroy(publicId, {
    resource_type: "image",
  });

  return result;
}

export { cloudinary };