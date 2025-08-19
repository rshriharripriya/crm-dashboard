"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loginSchema } from "@/lib/definitions";
import { getErrorMessage } from "@/lib/utils";

export async function login(prevState: unknown, formData: FormData) {
  console.log("Login action started");

  // Validate input
  const validatedFields = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  console.log("Input validation result:", validatedFields);

  if (!validatedFields.success) {
    console.log("Input validation failed");
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { username, password } = validatedFields.data;
  console.log("Validated data:", { username });

  // --- MOVED OUT OF TRY BLOCK ---
  let response;
  try {
    // Prepare form data for JWT login
    const formPayload = new URLSearchParams();
    formPayload.append('username', username);
    formPayload.append('password', password);
    formPayload.append('grant_type', 'password');

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ||
                      process.env.API_BASE_URL ||
                      'https://crm-dashboard-backend-rho.vercel.app';

    // Make the API call
    response = await fetch(`${apiBaseUrl}/auth/jwt/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formPayload.toString(),
      cache: 'no-store'
    });
    console.log("API response received:", response.status, response.statusText);

    if (!response.ok) {
      console.log("API response not ok");
      let errorData;
      const responseText = await response.text();
      console.log("Raw response text:", responseText);

      try {
        errorData = JSON.parse(responseText);
        console.log("Parsed API error data:", errorData);
      } catch {
        console.log("Could not parse error response as JSON");
        errorData = { detail: responseText || `Server returned ${response.status}` };
      }
      // Return early on error
      return {
        server_validation_error: getErrorMessage(errorData),
        status: response.status
      };
    }

  } catch (err) {
    // This catch block now ONLY handles fetch or network errors
    console.error("Login error:", err);
    return {
      server_error: "An unexpected error occurred. Please try again later.",
      error_details: err instanceof Error ? err.message : String(err)
    };
  }

  // --- SUCCESS PATH IS OUTSIDE THE TRY/CATCH ---
  // If we get here, the login was successful and there were no errors.

  const data = await response.json();
  const { access_token } = data;

  const cookieStore = await cookies();
  console.log("Setting cookie");
  cookieStore.set('accessToken', access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
  console.log("Cookie set successfully");

  // Now redirect. This will throw, but there's no catch block to stop it.
  console.log("Redirecting to dashboard");
  redirect("/dashboard");
}