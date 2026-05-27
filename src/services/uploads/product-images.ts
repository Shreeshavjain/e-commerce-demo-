import type { UploadApiOptions } from "cloudinary";
import { buildCloudinaryFolderPath, uploadBufferToCloudinary } from "@/services/cloudinary";

export type ProductImageUploadInput = {
  files: File[];
  productSlug?: string;
  colorName?: string;
  variantId?: string;
  folder?: string;
};

export type ProductImageUploadResult = {
  url: string;
  secureUrl: string;
  publicId: string;
  assetId: string | undefined;
  resourceType: string | undefined;
  format: string | undefined;
  width: number | undefined;
  height: number | undefined;
  bytes: number | undefined;
  originalFilename: string | undefined;
  folder: string;
  createdAt: string;
};

function buildUploadFolder(input: Pick<ProductImageUploadInput, "productSlug" | "colorName" | "variantId" | "folder">) {
  return buildCloudinaryFolderPath({
    subfolder: input.folder,
    productSlug: input.productSlug,
    colorName: input.colorName,
    variantId: input.variantId,
  });
}

function mapCloudinaryResult(result: Awaited<ReturnType<typeof uploadBufferToCloudinary>>, folder: string): ProductImageUploadResult {
  return {
    url: result.secure_url,
    secureUrl: result.secure_url,
    publicId: result.public_id,
    assetId: result.asset_id,
    resourceType: result.resource_type,
    format: result.format,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
    originalFilename: result.original_filename,
    folder,
    createdAt: result.created_at,
  };
}

// Upload logic stays here so the route can remain thin and future batch uploads can reuse the same code path.
export async function uploadProductImages(input: ProductImageUploadInput): Promise<ProductImageUploadResult[]> {
  if (input.files.length === 0) {
    throw new Error("At least one file is required");
  }

  const folder = buildUploadFolder(input);

  const uploads = await Promise.all(
    input.files.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());

      const result = await uploadBufferToCloudinary(buffer, {
        folder,
        resource_type: "image",
        overwrite: false,
        unique_filename: true,
        use_filename: false,
      } satisfies UploadApiOptions);

      return mapCloudinaryResult(result, folder);
    })
  );

  return uploads;
}

export function buildProductImageUploadFolder(input: Omit<ProductImageUploadInput, "files">) {
  return buildUploadFolder(input);
}