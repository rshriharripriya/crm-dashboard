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
  console.log("Validated data:", { username, password });

  try {
    // Prepare form data for JWT login
    const formPayload = new URLSearchParams();
    formPayload.append('username', username);
    formPayload.append('password', password);
    formPayload.append('grant_type', 'password');
    console.log("Form payload prepared:", formPayload.toString());

    // Make the API call
    const response = await fetch(`${process.env.API_BASE_URL}/auth/jwt/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formPayload,
      cache: 'no-store'
    });
    console.log("API response received:", response.status, response.statusText);

    if (!response.ok) {
      console.log("API response not ok");
      const errorData = await response.json();
      console.log("API error data:", errorData);
      return { server_validation_error: getErrorMessage(errorData) };
    }

    // Handle successful login
    const data = await response.json();
    console.log("API response data:", data);
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

    // Redirect to dashboard
    console.log("Redirecting to dashboard");
    try {
      redirect("/dashboard");
    } catch (redirectError) {
      // This is expected behavior for Next.js redirect in Server Actions
      // We can re-throw it to let Next.js handle it
      console.log("Redirect error (expected):", redirectError);
      throw redirectError;
    }

  } catch (err) {
    // Check if the error is a Next.js redirect error
    if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
      // Re-throw the redirect error so Next.js can handle it
      throw err;
    }
    
    console.error("Login error:", err);
    return {
      server_error: "An unexpected error occurred. Please try again later.",
    };
  }
}