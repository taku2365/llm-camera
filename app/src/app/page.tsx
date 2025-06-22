import { redirect } from "next/navigation"

export default async function Home() {
  // Redirect to the photo library
  redirect("/library")
}
