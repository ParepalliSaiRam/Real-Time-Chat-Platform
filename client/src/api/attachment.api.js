import axios from "./axios";

export async function uploadAttachment(
  conversationId,
  file,
  caption
) {
  const formData = new FormData();

  formData.append("file", file);

  if (caption) {
    formData.append("caption", caption);
  }

  const { data } = await axios.post(
    `/conversations/${conversationId}/attachments`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
}