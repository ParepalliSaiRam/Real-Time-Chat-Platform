import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { joinGroupByInvite } from "../api/group.api";
import { useConversation } from "../context/ConversationContext";
import Spinner from "../components/ui/Spinner";
import Button from "../components/common/Button";

export default function JoinGroup() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { loadConversations, setSelectedConversation } = useConversation();

  const [status, setStatus] = useState("joining");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await joinGroupByInvite(code);
        const conversationsData = await loadConversations();

        if (cancelled) return;

        const joined = conversationsData?.conversations?.find(
          (c) => c.id === data.conversationId
        );

        if (joined) setSelectedConversation(joined);

        toast.success("Joined the group.");
        navigate("/conversations", { replace: true });
      } catch (err) {
        if (cancelled) return;

        setStatus("error");
        setError(
          err.response?.data?.message || "Failed to join this group."
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (status === "error") {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-4 rounded-xl border bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-gray-800">
          Couldn't join group
        </h1>
        <p className="text-sm text-gray-500">{error}</p>
        <Button className="w-auto px-4" onClick={() => navigate("/conversations")}>
          Back to conversations
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 rounded-xl border bg-white p-8 text-center shadow-sm">
      <Spinner size={24} />
      <p className="text-sm text-gray-500">Joining group...</p>
    </div>
  );
}
