# Aroma De Luz Mobile App — Improvement & Feature Requirements

## 1. Overview

This document outlines the required improvements, fixes, design updates, and core functionality for the **Aroma De Luz mobile app**.

The goal is to make the mobile app feel polished, professional, consistent with the Aroma De Luz website and brand identity, and fully functional across authentication, payments, navigation, and account management.

---

## 2. Authentication & Google Sign-In

### Current Issues

- The Google login icon currently looks plain and unpolished.
- Selecting Google login opens an external browser.
- After selecting a Google account, the authentication flow redirects to a URL beginning with `localhost:3000`.
- The login/signup experience is therefore incomplete and unsuitable for a production mobile app.

### Required Improvements

- Redesign the **Google Sign-In button/icon** so it looks clean, modern, and professional.
- Fix the Google authentication flow so it works correctly within the mobile app experience.
- Remove the `localhost:3000` redirect from the production authentication flow.
- Configure the appropriate production redirect/deep-link mechanism for the mobile application.
- Ensure that users can successfully:
  1. Select **Sign in with Google**.
  2. Authenticate with their Google account.
  3. Return to the mobile app.
  4. Complete registration or login successfully.
  5. Remain signed in according to the app's authentication/session rules.
- Make sure the authentication flow works in both development/testing and production environments without exposing development URLs in the production app.

> **Important:** Do not use `localhost:3000` as a production callback or redirect URL.

---

## 3. Paystack Payment

### Current Issue

- The demo Paystack payment functionality is not working.

### Required Improvements

- Fix the Paystack payment integration.
- Ensure the payment process can be initiated successfully from the mobile app.
- Ensure successful payments are correctly verified.
- Handle failed, cancelled, and interrupted payments gracefully.
- Display an appropriate payment status to the user.
- Ensure that an order/payment is only marked as successfully paid after proper payment verification.
- Make the payment experience consistent with the Aroma De Luz mobile app's overall design.

---

## 4. Payment Confirmation Email

### Current Issue

- After completing a payment in the mobile app, no confirmation email is sent to the user's email address.

### Required Improvements

After a successful and verified payment:

- Send a payment/order confirmation email automatically.
- Send the email to the email address associated with the user's account/order.
- Include relevant order information, such as:
  - Customer name
  - Order/reference number
  - Items purchased
  - Order amount
  - Payment status
  - Date/time of transaction
- Make the email professional and consistent with the Aroma De Luz brand.
- Do not send a successful-payment confirmation until the payment has been properly verified.

---

## 5. Bottom Navigation

Create a **four-tab bottom navigation bar** with the following tabs, arranged from left to right:

1. **Home**
2. **Categories**
3. **Cart**
4. **Account**

### Functional Requirements

All four tabs must be fully functional.

### Home

The Home tab should provide the main shopping/discovery experience, including the appropriate core content and features from the Aroma De Luz website.

### Categories

The Categories tab should allow users to browse the available product categories and navigate to the relevant products.

### Cart

The Cart tab should allow users to:

- View products added to the cart.
- Adjust quantities.
- Remove products.
- View the cart subtotal/total.
- Proceed to checkout.

### Account

The Account tab should allow users to manage relevant account functionality, including appropriate features such as:

- Profile information
- Login/logout
- Orders/order history
- Account settings
- Other essential customer account features

---

## 6. Bring the Core Aroma De Luz Website Features to the Mobile App

The mobile app should contain the **necessary core features available on the Aroma De Luz website**.

Use the existing website as the primary reference for the brand's functionality, content structure, products, and customer experience.

### Feature Direction

Do not simply copy the website's layout onto the mobile app.

Instead:

- Adapt important website functionality for a mobile-first experience.
- Prioritize features that customers actually need when shopping on mobile.
- Keep navigation simple and intuitive.
- Preserve important product, shopping, checkout, and account functionality.
- Add any other features that are clearly necessary for a complete and professional shopping application.

### Product Experience

Where applicable, the mobile app should support:

- Product browsing
- Product categories
- Product details
- Product images
- Product pricing
- Product selection
- Add to cart
- Cart management
- Checkout
- Payment
- Order confirmation
- Order history
- Customer account management

Use good product-design judgment to determine additional features that would improve the overall customer experience.

---

## 7. Brand Colors & Visual Consistency

The mobile app must use the **same brand colors as the Aroma De Luz website**.

### Requirements

- Match the website's existing brand colors as closely as possible.
- Do **not** make the colors lighter.
- Do **not** make the colors darker.
- Do **not** use a faded or dimmed version of the brand colors.
- Maintain consistent colors across:
  - Backgrounds
  - Buttons
  - Navigation
  - Headers
  - Cards
  - Icons
  - Forms
  - Checkout
  - Account screens
  - Splash/launch screen
  - App icon

The mobile app should feel like a natural extension of the Aroma De Luz website.

---

## 8. Aroma De Luz Branding in the App Header

Remove the large logo currently displayed at the top of the mobile app.

Instead, display:

- **Aroma De Luz**
- The official brand tagline

The name and tagline should preserve the **original texture, visual character, and appearance of the brand logo/branding**.

### Design Direction

The result should be:

- Elegant
- Clean
- Minimal
- Premium
- Consistent with the original Aroma De Luz branding

Avoid replacing the brand identity with a generic text treatment.

---

## 9. Mobile App Icon

Create a clean and professional app icon based on the Aroma De Luz brand identity.

### Requirements

- Use the same brand color palette as the Aroma De Luz logo.
- Keep the icon clear and recognizable at small sizes.
- Maintain a clean and elegant appearance.
- Ensure the icon works well on both light and dark device backgrounds where applicable.
- Do **not** include the brand tagline on the app icon.
- Keep the icon visually simple rather than overcrowded.

The final icon should communicate the Aroma De Luz brand clearly without requiring the tagline.

---

## 10. Splash / Launch Screen

When the mobile app is opened, the initial splash/launch screen should look polished and professional.

### Requirements

The splash screen should be:

- Clear
- Neat
- Well-defined
- Elegant
- Brand-consistent
- Fast and visually clean

It should use the official Aroma De Luz visual identity and brand colors.

Avoid unnecessary visual clutter, excessive animation, or low-quality graphics.

The splash screen should transition smoothly into the main app experience.

---

## 11. Overall UX/UI Quality

The entire application should feel like a **finished, production-ready mobile shopping app**, not a basic website wrapped inside a mobile application.

### Design Principles

Prioritize:

- Simplicity
- Clarity
- Consistency
- Mobile-first design
- Easy navigation
- Fast interactions
- Professional visual hierarchy
- Accessible controls
- Consistent spacing
- Consistent typography
- Clear feedback for user actions
- Professional error and empty states

All screens should follow a consistent design system.

---

## 12. Error Handling & User Feedback

The app should provide clear feedback when an action succeeds or fails.

This should include appropriate states for:

- Failed login
- Cancelled Google authentication
- Network errors
- Failed payment
- Cancelled payment
- Payment verification failure
- Empty cart
- Failed checkout
- Failed order submission
- Failed data loading

Messages should be simple and understandable to normal users.

Avoid exposing technical information such as internal server errors, localhost URLs, stack traces, or implementation details.

---

## 13. Production Readiness Checklist

Before considering the mobile app complete, verify that:

- [ ] Google Sign-In works correctly.
- [ ] No production authentication flow redirects to `localhost:3000`.
- [ ] Users can return successfully to the mobile app after Google authentication.
- [ ] Paystack payment works correctly.
- [ ] Payment verification works correctly.
- [ ] Failed and cancelled payments are handled properly.
- [ ] Payment confirmation emails are sent after successful payment verification.
- [ ] Home tab works.
- [ ] Categories tab works.
- [ ] Cart tab works.
- [ ] Account tab works.
- [ ] Core Aroma De Luz website functionality needed by customers is available in the mobile app.
- [ ] Brand colors match the website.
- [ ] The top logo has been replaced with the appropriate Aroma De Luz name/tagline treatment.
- [ ] The app icon is clean and contains no tagline.
- [ ] The splash/launch screen is polished and brand-consistent.
- [ ] The app provides clear feedback for successful and failed actions.
- [ ] No development URLs or unnecessary technical details are exposed to users.
- [ ] The overall experience feels consistent with the Aroma De Luz brand.

---

## 14. Final Objective

The final result should be a **fully functional, polished, mobile-first Aroma De Luz shopping application** that:

1. Provides reliable authentication.
2. Supports working Paystack payments.
3. Sends payment/order confirmation emails.
4. Has functional Home, Categories, Cart, and Account navigation.
5. Includes the essential shopping features from the Aroma De Luz website.
6. Uses the exact brand color direction of the existing website.
7. Maintains the original Aroma De Luz visual identity.
8. Uses a clean, elegant app icon without the tagline.
9. Provides a professional splash/launch experience.
10. Feels cohesive, reliable, and production-ready.

The implementation should use sound product and engineering judgment where the original requirements do not specify a particular technical solution.
