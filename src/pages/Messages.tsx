import { Header } from "@/components/Header";
import { Guestbook } from "@/components/Guestbook";

export default function Messages() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Guestbook />
    </div>
  );
}