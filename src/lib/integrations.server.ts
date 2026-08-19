export async function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: "gemini-3.6-flash" });
}

export async function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  const { Resend } = await import("resend");
  return new Resend(apiKey);
}

export async function uploadSchoolAsset(base64Image: string) {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error("Cloudinary credentials are not configured.");
  }
  const { v2: cloudinary } = await import("cloudinary");
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return cloudinary.uploader.upload(base64Image, {
    folder: "icademia_school_assets",
    resource_type: "auto",
  });
}
