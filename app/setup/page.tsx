// app/setup/page.tsx
"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// Schema: name, regno, dob, dept, personal_email, phone
const StudentSchema = z.object({
  name: z.string().min(2, "Name is required"),
  regno: z.string().min(2, "Registration number is required"),
  dob: z.coerce.date(),
  dept: z.string().min(1, "Department is required"),
  personal_email: z.string().email("Valid email required"),
  phone: z.string().min(7, "Phone is required"),
});

type StudentForm = z.infer<typeof StudentSchema>;

export default function SetupPage() {
  const router = useRouter();
  const form = useForm<StudentForm>({
    resolver: zodResolver(StudentSchema),
    defaultValues: {
      name: "",
      regno: "",
      // keep dob as empty string to bind to <input type="date" />
      // z.coerce.date() will coerce on submit
      dob: undefined as unknown as Date,
      dept: "",
      personal_email: "",
      phone: "",
    },
  });

  async function onSubmit(values: StudentForm) {
    const res = await fetch("/api/students/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // normalize dob to ISO string for the API
      body: JSON.stringify({ ...values, dob: values.dob?.toISOString?.() }),
    });
    if (res.ok) {
      router.replace("/home");
    } else {
      const { error } = await res.json().catch(() => ({ error: "Failed" }));
      alert(error ?? "Failed to save");
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-xl border border-secondary/30 bg-secondary/5 shadow-sm">
        <div className="px-6 pt-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            <span className="border-l-4 border-accent pl-3">Complete student profile</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Provide the following details to continue.
          </p>
        </div>

        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Jane Doe"
                        {...field}
                        className="focus-visible:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="regno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration No.</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="23XXXXXXX"
                        {...field}
                        className="focus-visible:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? new Date(field.value).toISOString().slice(0, 10) : ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="focus-visible:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="dept"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="focus-visible:ring-primary">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CSE">CSE</SelectItem>
                          <SelectItem value="ECE">ECE</SelectItem>
                          <SelectItem value="EEE">EEE</SelectItem>
                          <SelectItem value="MECH">MECH</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="personal_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="name@gmail.com"
                          {...field}
                          className="focus-visible:ring-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+91 9XXXXXXXXX"
                        {...field}
                        className="focus-visible:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Save & Continue
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </main>
  );
}
