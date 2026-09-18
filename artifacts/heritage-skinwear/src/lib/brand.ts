export const BUSINESS_NAME = 'Leather & Sealskin Creations';
export const WHATSAPP_DESTINATION = 'https://wa.me/15551234567';

export function openWhatsAppEnquiry(productName?: string) {
  const message = productName
    ? `Hello, I’d like to ask about the ${productName}. Could you share current materials, sizing, availability, pricing, and shipping options?`
    : `Hello, I’d like to start a custom conversation with ${BUSINESS_NAME}. Could you tell me what is currently available?`;
  window.open(`${WHATSAPP_DESTINATION}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
}