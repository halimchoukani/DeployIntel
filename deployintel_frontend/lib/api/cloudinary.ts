/**
 * Uploads an image file directly to Cloudinary using an unsigned upload preset.
 * Returns an optimized hosted URL for the uploaded user avatar.
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || cloudName === "your_cloud_name") {
    throw new Error(
      "Cloudinary Cloud Name is not configured. Please update NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in .env"
    );
  }

  if (!uploadPreset || uploadPreset === "your_unsigned_preset_name") {
    throw new Error(
      "Cloudinary Upload Preset is not configured. Please create an unsigned upload preset and set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env"
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Cloudinary upload failed with status ${res.status}`);
  }

  const data = await res.json();

  // If public_id is available, return an optimized face-focused 200x200 crop URL
  if (data.public_id) {
    return `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,g_face,w_200,h_200,q_auto,f_auto/${data.public_id}`;
  }

  return data.secure_url;
}
