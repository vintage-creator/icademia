import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send } from "lucide-react";
import { getAdminToken, getSchoolCode } from "@/lib/utils";
import { getMessagesDb, getTeachersDb, sendMessageDb } from "@/lib/api/db.functions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Message = {
  id: number;
  school_id: number;
  sender_type: "admin" | "teacher";
  sender_id: number;
  receiver_type: "admin" | "teacher";
  receiver_id: number;
  message_body: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
};

export function MessagingPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [userType, setUserType] = useState<"admin" | "teacher">("admin");
  const [userId, setUserId] = useState(0);
  const [teachers, setTeachers] = useState<
    Array<{ id: number; name: string; role: string; status: string }>
  >([]);
  const [recipientId, setRecipientId] = useState<number>(-1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const teacherProfile = localStorage.getItem("teacher_profile");
    if (teacherProfile) {
      try {
        const p = JSON.parse(teacherProfile);
        setUserType("teacher");
        setUserId(p.id);
      } catch {
        localStorage.removeItem("teacher_profile");
      }
    } else {
      setUserType("admin");
      setUserId(0);
      const schoolCode = getSchoolCode();
      if (schoolCode)
        getTeachersDb({ data: { token: getAdminToken(), schoolCode } }).then((rows) =>
          setTeachers(
            rows as unknown as Array<{ id: number; name: string; role: string; status: string }>,
          ),
        );
    }
  }, []);

  const fetchMessages = async () => {
    const schoolCode = getSchoolCode();
    if (!schoolCode) return;
    try {
      const data = await getMessagesDb({ data: { schoolCode, userId, userType } });
      setMessages(data as Message[]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (open) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [open, userId, userType]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const schoolCode = getSchoolCode();
    if (!schoolCode) return;

    try {
      const receiverType = userType === "admin" ? "teacher" : "admin";
      const receiverId = userType === "admin" ? recipientId : 0;

      await sendMessageDb({
        data: {
          schoolCode,
          senderType: userType,
          senderId: userId,
          receiverType,
          receiverId,
          messageBody: input.trim(),
        },
      });
      setInput("");
      fetchMessages();
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative h-8 px-2.5 gap-1.5 rounded-full border-border hover:bg-muted/80 shadow-sm"
        >
          <MessageCircle className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold hidden sm:inline">Staff Chat</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-[90vh] sm:h-full border-l p-0 rounded-t-3xl sm:rounded-none inset-x-0 bottom-0 sm:inset-y-0 sm:left-auto sm:right-0 shadow-2xl">
        {/* Mobile Swipe / Drag Indicator Handle */}
        <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20 mx-auto mt-2 sm:hidden" />

        <SheetHeader className="p-4 border-b flex flex-row items-center justify-between">
          <SheetTitle className="flex items-center gap-2 text-base font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
              <MessageCircle className="h-4 w-4" />
            </span>
            <span>Staff Operational Chat</span>
          </SheetTitle>
        </SheetHeader>

        {userType === "admin" && (
          <div className="border-b p-3">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Send to
            </label>
            <select
              value={recipientId}
              onChange={(e) => setRecipientId(Number(e.target.value))}
              className="h-9 w-full rounded-md border bg-background px-3 text-xs"
            >
              <option value={-1}>All Head Teachers (broadcast)</option>
              {teachers
                .filter(
                  (teacher) => teacher.role === "Head Teacher" && teacher.status !== "Suspended",
                )
                .map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full grid place-items-center text-center p-6 text-muted-foreground text-xs space-y-1">
              <div>
                <MessageCircle className="h-8 w-8 opacity-40 mx-auto mb-2 text-primary" />
                <p className="font-semibold text-foreground text-sm">Staff Communication Channel</p>
                <p>Send direct messages between the School Admin and Head Teachers.</p>
              </div>
            </div>
          ) : (
            messages
              .filter((msg) =>
                userType === "teacher" || recipientId === -1
                  ? userType === "teacher" || msg.receiver_id === -1
                  : (msg.sender_type === "teacher" && msg.sender_id === recipientId) ||
                    (msg.receiver_type === "teacher" && msg.receiver_id === recipientId),
              )
              .map((msg) => {
                const isMine = msg.sender_type === userType && msg.sender_id === userId;
                return (
                  <div
                    key={msg.id}
                    className={cn("flex w-full", isMine ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3.5 py-2 text-xs shadow-xs leading-relaxed",
                        isMine
                          ? "bg-primary text-primary-foreground rounded-br-xs font-medium"
                          : "bg-muted text-foreground rounded-bl-xs border border-border",
                      )}
                    >
                      <div className="font-bold text-[9px] opacity-70 mb-0.5 uppercase tracking-wider">
                        {msg.sender_name ||
                          (msg.sender_type === "admin" ? "School Admin" : "Head Teacher")}
                        {msg.receiver_id === -1 ? " · Broadcast" : ""}
                      </div>
                      <p className="break-words">{msg.message_body}</p>
                    </div>
                  </div>
                );
              })
          )}
        </div>

        <div className="p-3 border-t bg-background">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-1 bg-muted/50 border border-border rounded-full px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-full h-8 w-8 shrink-0 gradient-primary text-primary-foreground"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
