export type StaticPageSlug =
  | 'about-us'
  | 'contact-us'
  | 'privacy-policy'
  | 'terms-and-conditions'
  | 'shipping-and-return-policy';

export interface StaticPageDefault {
  slug: StaticPageSlug;
  title: string;
  content: string;
}

export const STATIC_PAGE_OPTIONS: Array<{ slug: StaticPageSlug; label: string }> = [
  { slug: 'about-us', label: 'About Us' },
  { slug: 'contact-us', label: 'Contact Us' },
  { slug: 'privacy-policy', label: 'Privacy Policy' },
  { slug: 'terms-and-conditions', label: 'Terms & Conditions' },
  { slug: 'shipping-and-return-policy', label: 'Shipping & Return Policy' },
];

export const STATIC_PAGE_DEFAULTS: Record<StaticPageSlug, StaticPageDefault> = {
  'about-us': {
    slug: 'about-us',
    title: 'About Us',
    content: `Welcome to Plants In Garden.

We are a plant-first brand focused on bringing healthy plants and practical gardening solutions to every home.

What we believe:
- Plants should be easy to buy, easy to care for, and joyful to live with.
- Quality and freshness matter at every stage.
- Customer support should feel personal and helpful.

What we offer:
- Indoor and outdoor plants
- Pots, planters, and accessories
- Garden care essentials
- Seasonal collections and curated gifting options

Our mission is simple: make plant parenting enjoyable for everyone.`
  },
  'contact-us': {
    slug: 'contact-us',
    title: 'Contact Us',
    content: `We are here to help.

For order, delivery, product, or plant care support, contact us using the details below.

Customer Support:
- Email: support@plantsingarden.com
- Phone: +91-9000000000
- WhatsApp: +91-9000000000

Working Hours:
- Monday to Saturday
- 9:30 AM to 6:30 PM

Office Address:
Plants In Garden
[Add your complete office address here]

Please keep your order ID ready when contacting support for faster resolution.`
  },
  'privacy-policy': {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    content: `Your privacy is important to us.

Information we collect:
- Name, phone number, email address
- Shipping and billing address
- Order and payment transaction references
- Basic usage and device data for analytics

How we use your information:
- Process and deliver orders
- Send order updates and customer support responses
- Improve website performance and shopping experience
- Share relevant service messages and policy updates

Data sharing:
- We do not sell personal data.
- We may share required data with payment gateways, logistics, and service providers only to fulfill services.
- We may disclose data if required by law.

Security:
- We use reasonable technical and organizational safeguards to protect your data.

Cookies:
- Cookies are used to improve site functionality, login continuity, and analytics.

Policy updates:
- We may update this policy from time to time. Continued use of the website means acceptance of updates.

For privacy queries, contact: support@plantsingarden.com`
  },
  'terms-and-conditions': {
    slug: 'terms-and-conditions',
    title: 'Terms & Conditions',
    content: `By using this website, you agree to the terms below.

General:
- These terms govern access, browsing, and purchases on our platform.
- We may revise these terms at any time.

Orders and acceptance:
- Placing an order is an offer to purchase.
- We reserve the right to accept, reject, or cancel orders in specific situations.

Pricing and payment:
- Prices are displayed on the website and may change without prior notice.
- In case of technical or typographical pricing errors, we may cancel the order and process refund as applicable.

Products and availability:
- Product images are representative; natural products may vary in size, color, or shape.
- Availability may change without notice.

User responsibilities:
- Provide accurate account and delivery information.
- Keep login credentials secure.
- Avoid misuse, unlawful activity, or prohibited content.

Liability:
- We are not liable for indirect, incidental, or consequential losses to the extent permitted by law.

Governing law:
- These terms are governed by the applicable laws of India.

For grievance and support, contact: support@plantsingarden.com`
  },
  'shipping-and-return-policy': {
    slug: 'shipping-and-return-policy',
    title: 'Shipping & Return Policy',
    content: `Shipping:
- Orders are usually dispatched within 1–2 working days.
- Delivery timelines vary by location, generally within 2–7 working days after dispatch.
- Tracking details are shared once the order is shipped.

Plants return policy:
- Live plants are generally non-returnable due to transit sensitivity.
- If a plant arrives damaged or unhealthy, contact support within 24 hours with clear photos and order ID.

Non-plant return policy:
- Damaged, defective, or wrong non-plant items are eligible for return/replacement as per review.
- Return request should be raised within 7 days of delivery unless stated otherwise.
- Item should be unused and in original packaging wherever applicable.

Refunds:
- Approved refunds are processed to the original payment method.
- Refund settlement time depends on payment partner and bank timelines.

Important notes:
- Delays due to weather, courier disruption, or force majeure may impact delivery timelines.
- We reserve the right to update this policy as needed.

For shipping/returns help, contact: support@plantsingarden.com`
  },
};
