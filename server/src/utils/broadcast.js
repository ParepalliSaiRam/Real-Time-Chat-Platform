export const emitToUsers = (io, userIds, event, payload) => {
  for (const userId of userIds) {
    io.to(`user:${userId}`).emit(event, payload);
  }
};

export const getMessagePreview = (message) => {
  if (!message) return "";

  if (message.isDeleted) {
    return "This message was deleted.";
  }

  switch (message.type) {
    case "IMAGE":
      return message.content ? `📷 ${message.content}` : "📷 Photo";

    case "FILE":
      return message.content
        ? `📄 ${message.content}`
        : `📄 ${message.attachment?.fileName ?? "File"}`;

    default:
      return message.content ?? "";
  }
};