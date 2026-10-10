export const siteConfig = {
  name: "San3D",
  description:
    "Thoughtful 3D printed objects for your space, your people, and your everyday. Explore the San3D demo collection.",
  email: "sanskarsharma0310@gmail.com",
  phone: "+91 7250307422",
  whatsapp: "917250307422",
  currency: "INR",
  locale: "en-IN",
} as const;
export function whatsappUrl(
  message = "Hi San3D! I’d like to know more about your 3D printed products.",
) {
  return `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(message)}`;
}
