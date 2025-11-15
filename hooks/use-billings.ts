import { useCreateCheckoutMutation } from "@/redux/api/billing";
import { useAppSelector } from "@/redux/store";
import { PENDING_CHECKOUT_STORAGE_KEY } from "@/lib/billing";
import { toast } from "sonner";

export const useSubscriptionPlan = () => {
  const [trigger, { isLoading }] = useCreateCheckoutMutation();
  const user = useAppSelector(state => state.profile.user);
  const userId = user?.id;

  const onSubscribe = async () => {
    if (!userId) {
      console.error("[billing] Missing authenticated user for checkout", user);
      toast.error("We could not verify your account. Please refresh and try again.");
      return;
    }

    try {
      const res = await trigger({ userId }).unwrap();

      if (!res || typeof res.url !== "string" || res.url.trim().length === 0) {
        throw new Error("Checkout URL is missing or invalid.");
      }

      if (typeof window !== "undefined" && typeof res.checkoutId === "string") {
        try {
          window.localStorage.setItem(
            PENDING_CHECKOUT_STORAGE_KEY,
            res.checkoutId
          );
        } catch (storageError) {
          console.warn("[billing] Failed to persist checkout id", storageError);
        }
      }

      const checkoutUrl = new URL(res.url).toString();
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error("Checkout error:", err);
      const message =
        err instanceof Error ? err.message : "Could not start checkout. Please try again.";
      toast.error(message);
    }
  };

  return { onSubscribe, isLoading };
};
