# Page snapshot

```yaml
- alert
- banner:
  - combobox:
    - option "English" [selected]
    - option "Français"
    - option "Português"
- text: Sign in Enter your credentials to access your account Email
- textbox "Email"
- text: Password
- link "Forgot password?":
  - /url: /auth/reset-password
- textbox "Password"
- button "Sign In"
- text: Or continue with
- button "GitHub"
- button "Google":
  - img
  - text: Google
- button "Sign in with SAML"
- text: Don't have an account?
- link "Sign up":
  - /url: /signup
- region "Notifications (F8)":
  - list
- button "Help"
```