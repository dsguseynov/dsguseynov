import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <div>
      <AuthForm mode="login" />
      <p className="mt-6 text-center text-sm text-muted">
        Нет аккаунта?{" "}
        <Link href="/register" className="font-semibold text-primary">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}
