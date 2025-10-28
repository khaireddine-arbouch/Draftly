import {
    convexAuthNextjsMiddleware,
    createRouteMatcher,
    nextjsMiddlewareRedirect,
  } from '@convex-dev/auth/nextjs/server';
  import { isBypassRoutes, isProtectedRoutes, isPublicRoutes } from './lib/permissions';
  
  // Create route matchers for public and bypass routes
  const PublicMatcher = createRouteMatcher(isPublicRoutes);
  const BypassMatcher = createRouteMatcher(isBypassRoutes);
  const ProtectedMatcher = createRouteMatcher(isProtectedRoutes);
  
  // Middleware for authentication handling
  export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
    // Skip middleware if the route matches bypass rules
    if (BypassMatcher(request)) {
      return;
    }
  
    // Check if the user is authenticated
    const isAuthenticated = await convexAuth.isAuthenticated();
  
    // Redirect authenticated users to the dashboard if accessing public routes
    if (PublicMatcher(request) && isAuthenticated) {
      return nextjsMiddlewareRedirect(request, '/dashboard');
    }

    // Redirect authenticated users to the sign in page if accessing protected routes
    if (ProtectedMatcher(request) && !isAuthenticated) {
        return nextjsMiddlewareRedirect(request, '/auth/sign-in');
      }
  },
{
    cookieConfig: { maxAge: 60 * 60 * 24 * 30} // 30 days
});
   
export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};