import { redirect } from "next/navigation";

export default function Home() {
  // Redirect halaman utama ke /dashboard
  redirect("/dashboard");
}
