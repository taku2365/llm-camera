import { redirect } from "next/navigation"

export default function EditorPage() {
  // Redirect to library if no photo is selected
  redirect("/")
}