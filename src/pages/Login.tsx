import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ALLOWED_USERS } from "@/lib/constants";
import { getCurrentUser, isAllowedUser, setCurrentUser } from "@/lib/auth";
import { Clock } from "lucide-react";

const schema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .refine((v) => isAllowedUser(v), "User not authorized"),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "" },
  });

  useEffect(() => {
    if (getCurrentUser()) navigate("/", { replace: true });
  }, [navigate]);

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
              <Button type="submit" className="w-full">Sign in</Button>
              <p className="text-xs text-muted-foreground text-center pt-2">
                Allowed: {ALLOWED_USERS.join(", ")}
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}