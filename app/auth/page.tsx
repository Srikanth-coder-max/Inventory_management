import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";

interface PageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function AuthPage({ searchParams }: PageProps) {
  const session = await auth();
  const { callbackUrl } = await searchParams;

  if (session) {
    redirect(callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/");
  }

  return <AuthForm />;
}