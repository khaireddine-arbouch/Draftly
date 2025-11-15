import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

type CreateCheckoutResponse = {
  url: string;
  checkoutId?: string;
};

export const BillingApi = createApi({
  reducerPath: 'billing',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/billing' }),
  endpoints: (builder) => ({
    createCheckout: builder.mutation<CreateCheckoutResponse, { userId: string }>({
      query: (body: { userId: string }) => ({
        url: '/checkout',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useCreateCheckoutMutation } = BillingApi;