export const sanitizeLettersOnly = (value) =>
  value.replace(/[^a-zA-ZÀ-ÿñÑ\s]/g, "");

export const sanitizePhone = (value) =>
  value.replace(/[^0-9+\-\s()]/g, "").slice(0, 8);

export const blockInvalidNumberKeys = (e) => {
  if (["e", "E", "+", "-"].includes(e.key)) {
    e.preventDefault();
  }
};

const DOCUMENT_CONFIG = {
  DPI: { maxLength: 13, placeholder: "1234567890123" },
  "Licencia de conducir": { maxLength: 13, placeholder: "1234567890123" },
  Pasaporte: { maxLength: 15, placeholder: "123456789012345" },
};

export const getDocumentMaxLength = (type) => DOCUMENT_CONFIG[type]?.maxLength ?? 20;

export const getDocumentPlaceholder = (type) => DOCUMENT_CONFIG[type]?.placeholder ?? "Número de documento";

export const sanitizeDocumentNumber = (value, type) =>
  value.replace(/[^0-9]/g, "").slice(0, getDocumentMaxLength(type));
