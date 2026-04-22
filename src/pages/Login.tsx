import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Clock } from "lucide-react";
import { getUserProfile, getUsers } from "@/lib/services/users";
import { toUserPath } from "@/lib/session";
import { ApiError } from "@/lib/services/http";

const schema = z.object({
  username: z.string().min(1, "Username is required"),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const [allowedUsers, setAllowedUsers] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "" },
  });

  useEffect(() => {
    void getUsers()
      .then((users) => {
        setAllowedUsers(users.map((user) => user.username));
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 0) {
          setLoadError(error.message);
          return;
        }

        setLoadError("Unable to load users from the API.");
      });
  }, []);

  const onSubmit = async (values: FormValues) => {
    try {
      const user = await getUserProfile(values.username);
      navigate(toUserPath("/", user.username), { replace: true });
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 0) {
        form.setError("username", { message: error.message });
        return;
      }

      form.setError("username", { message: "User not authorized" });
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
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
              <Button type="submit" className="w-full">
                Sign in
              </Button>
              {loadError ? (
                <p className="pt-2 text-center text-xs text-destructive">{loadError}</p>
              ) : (
                <p className="pt-2 text-center text-xs text-muted-foreground">
                  Allowed: {allowedUsers.join(", ")}
                </p>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
