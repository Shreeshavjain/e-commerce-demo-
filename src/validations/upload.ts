export const allowedProductImageMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export const allowedProductImageExtensions = new Set(["jpg", "jpeg", "png", "webp", "avif"]);
export const maxProductImageFileSizeBytes = 10 * 1024 * 1024;
export const maxProductImageUploadCount = 10;

export type ProductImageValidationIssue = {
  index: number;
  fileName: string;
  message: string;
};

function getFileExtension(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1) ?? "" : "";
}

export function validateProductImageFile(file: File, index = 0): ProductImageValidationIssue | null {
  if (!file || typeof file !== "object") {
    return {
      index,
      fileName: "unknown",
      message: "Invalid file payload",
    };
  }

  if (file.size === 0) {
    return {
      index,
      fileName: file.name || "unknown",
      message: "Empty uploads are not allowed",
    };
  }

  if (file.size > maxProductImageFileSizeBytes) {
    return {
      index,
      fileName: file.name || "unknown",
      message: `File size must be ${Math.round(maxProductImageFileSizeBytes / (1024 * 1024))}MB or smaller`,
    };
  }

  if (!allowedProductImageMimeTypes.has(file.type.toLowerCase())) {
    return {
      index,
      fileName: file.name || "unknown",
      message: "Unsupported image type",
    };
  }

  const extension = getFileExtension(file.name);

  if (!allowedProductImageExtensions.has(extension)) {
    return {
      index,
      fileName: file.name || "unknown",
      message: "Unsupported image extension",
    };
  }

  return null;
}

export function validateProductImageFiles(files: Array<File | null | undefined>) {
  const normalizedFiles = files.filter((file): file is File => Boolean(file));
  const issues: ProductImageValidationIssue[] = [];

  if (normalizedFiles.length === 0) {
    issues.push({
      index: 0,
      fileName: "unknown",
      message: "At least one image file is required",
    });

    return { files: [], issues };
  }

  if (normalizedFiles.length > maxProductImageUploadCount) {
    issues.push({
      index: maxProductImageUploadCount,
      fileName: "batch",
      message: `You can upload up to ${maxProductImageUploadCount} images at a time`,
    });
  }

  for (const [index, file] of normalizedFiles.entries()) {
    const issue = validateProductImageFile(file, index);

    if (issue) {
      issues.push(issue);
    }
  }

  return { files: issues.length > 0 ? [] : normalizedFiles, issues };
}