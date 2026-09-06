import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import RightRail from "./RightRail";
import MobileNav from "./MobileNav";
import Modal from "../common/Modal";
import ComposeBox from "../post/ComposeBox";
import { useToast } from "../../context/ToastContext";

export default function AppShell() {
  const [composeOpen, setComposeOpen] = useState(false);
  const { push } = useToast();

  return (
    <div className="mx-auto flex min-h-screen max-w-[1280px]">
      <Sidebar onCompose={() => setComposeOpen(true)} />

      <main className="min-h-screen w-full min-w-0 flex-1 border-r border-border pb-16 sm:pb-0 lg:max-w-[600px]">
        <Outlet />
      </main>

      <RightRail />
      <MobileNav />

      <Modal open={composeOpen} onClose={() => setComposeOpen(false)}>
        <h2 className="mb-1 font-serif text-lg text-text">New post</h2>
        <ComposeBox
          autoFocus
          onCreated={() => {
            setComposeOpen(false);
            push("Posted — running verification…");
          }}
        />
      </Modal>
    </div>
  );
}
