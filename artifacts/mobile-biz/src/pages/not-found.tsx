import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center h-[70vh] text-center">
        <h1 className="text-8xl font-bold text-primary text-glow font-mono">404</h1>
        <p className="mt-4 text-xl text-muted-foreground max-w-md">
          The module you are looking for has been moved or doesn't exist.
        </p>
        <Button asChild className="mt-8">
          <Link href="/">Return to Dashboard</Link>
        </Button>
      </div>
    </Layout>
  );
}
