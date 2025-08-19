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

  try {
    // Prepare form data for JWT login
    const formPayload = new URLSearchParams();
    formPayload.append('username', username);
    formPayload.append('password', password);
    formPayload.append('grant_type', 'password');

    // Get API URL - handle both client and server side
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 
                      process.env.API_BASE_URL || 
                      'https://crm-dashboard-backend-rho.vercel.app';
    

    // Make the API call
    const response = await fetch(`${apiBaseUrl}/auth/jwt/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formPayload.toString(), // Convert URLSearchParams to string
      cache: 'no-store'
    });
    console.log("API response received:", response.status, response.statusText);

    if (!response.ok) {
      console.log("API response not ok");
      
      // Try to parse error response
      let errorData;
      try {
        errorData = await response.json();
        console.log("API error data:", errorData);
      } catch (e) {
        console.log("Could not parse error response as JSON");
        const text = await response.text();
        errorData = { detail: text || `Server returned ${response.status}` };
      }
      
      return { 
        server_validation_error: getErrorMessage(errorData),
        status: response.status
      };
    }

    // Handle successful login
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

    // Redirect to dashboard
    console.log("Redirecting to dashboard");
    redirect("/dashboard");

  } catch (err) {
    // Check if the error is a Next.js redirect error
    if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
      console.log("Redirect successful");
      throw err; // Re-throw to let Next.js handle the redirect
    }
    
    console.error("Login error:", err);
    return {
      server_error: "An unexpected error occurred. Please try again later.",
      error_details: err instanceof Error ? err.message : String(err)
    };
  }
}