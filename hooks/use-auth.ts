import { useAuthActions } from '@convex-dev/auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

const signInSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8,'Password must be at least 8 characters long'),
});

const signUpSchema = z.object({
    email: z.string().email("Email is required"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    firstname: z.string().min(1, "Firstname is required"),
    lastname: z.string().min(1, "Lastname is required"),
});

type SignInData = z.infer<typeof signInSchema>;
type SignUpData = z.infer<typeof signUpSchema>;

export const useAuth = () => {
  // Destructure auth actions from useAuthActions hook
  const { signIn, signOut } = useAuthActions();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  // Initialize form with react-hook-form
  const signInForm = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  const signUpForm = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      firstname: '',
      lastname: '',
    },
  });

  // Handle sign in
  const handleSignIn = async (data: SignInData) => {
    setIsLoading(true);
    try {
        await signIn("password", { email: data.email, password: data.password, flow: "signIn"});
        router.push("/dashboard");
    } catch (error) {
        console.error(error);
        signInForm.setError("password", { message: "Invalid email or password" });
        toast.error("Failed to sign in");
    } finally {
        setIsLoading(false);
        toast.success("Signed in successfully");
    }
  };

  // Handle sign up
  const handleSignUp = async (data: SignUpData) => {
    setIsLoading(true);
    try {
        await signIn("password", { email: data.email, password: data.password, name: `${data.firstname} ${data.lastname}`, flow: "signUp"});
        router.push("/dashboard");
    } catch (error) {
        console.error(error);
        signUpForm.setError("password", { message: "Failed to sign up. Please try again." });
        toast.error("Failed to sign up. Please try again.");
    } finally {
        setIsLoading(false);
        toast.success("Signed up successfully");
    }
  };
  
  // Handle sign out
  const handleSignOut = async () => {
    try {
        await signOut();
        router.push("/auth/sign-in");
    } catch (error) {
        console.error(error);
        toast.error("Failed to sign out. Please try again.");
    } finally {
        setIsLoading(false);
        toast.success("Signed out successfully");
    }
    router.push("/auth/sign-in");
  };

  // You can return whatever you need from this hook, like the form, loading state, and actions
  return {
    signInForm,
    signUpForm,
    isLoading,
    handleSignIn,
    handleSignUp,
    handleSignOut,
    signOut
  };
};