import type { Metadata } from "next";
import { RecitationApp } from "./recitation-app";

export const metadata: Metadata = {
  title: "Word in Heart / 藏在心裡",
  description: "Private, offline-first Bible verse memorization and recitation.",
};

export default function Home() {
  return <RecitationApp />;
}
