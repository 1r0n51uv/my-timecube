import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigate, useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { useAppConfigQuery } from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { isAllowedUser, setCurrentUser, useCurrentUser } from "@/lib/auth";

type FormValues = {
  username: string;
};

export default function Login() {
  const navigate = useNavigate();
  const configQuery = useAppConfigQuery();
  const currentUser = useCurrentUser();
  const schema = useMemo(
    () =>
      z.object({
        username: z
          .string()
          .min(1, "Username is required")
          .refine(
            (value) => isAllowedUser(value, configQuery.data?.allowedUsers ?? []),
            "User not authorized",
          ),
      }),
    [configQuery.data],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "" },
  });

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = (values: FormValues) => {
    setCurrentUser(values.username);
    navigate("/", { replace: true });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <CardTitle>Agile Time Tracker</CardTitle>
          <CardDescription>Sign in with your username</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="mario.rossi" autoComplete="username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={configQuery.isLoading}>
                Sign in
              </Button>
              <p className="text-xs text-muted-foreground text-center pt-2">
                Allowed: {(configQuery.data?.allowedUsers ?? []).join(", ")}
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
